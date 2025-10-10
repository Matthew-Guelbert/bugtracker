import express from 'express';
import { ObjectId } from 'mongodb';
import { GetAllBugs, GetBugById, AddBug, UpdateBug, ClassifyBug, AssignBug, CloseBug, GetAllComments, GetCommentById, AddComment, saveAuditLog, getSortOptions, connect } from '../../database.js';
import debug from 'debug';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';
import { isLoggedIn, fetchRoles, mergePermissions, hasPermission, hasRole, hasAnyRole } from '@merlin4/express-auth';
const router = express.Router();
const debugBug = debug('app:BugRouter');
router.use(express.urlencoded({ extended: false }));

import Joi from 'joi';
import { bugSchema, bugIdSchema, bugUpdateSchema, classifyBugSchema, assignBugSchema, closeBugSchema, logHoursSchema } from '../../schema/bugSchema.js';
import { commentSchema } from '../../schema/commentSchema.js';

// List all bugs
router.get('', isLoggedIn(), async (req, res) => {
  let { keywords, classification, maxAge, minAge, closed, sortBy, pageSize, pageNumber } = req.query;
  const match = {};
  const sortOptions = getSortOptions(sortBy, 'bug');

  try {
    // Keywords search
    if (keywords) {
      match.$or = [
        { title: { $regex: keywords, $options: 'i' } },
        { description: { $regex: keywords, $options: 'i' } },
        { stepsToReproduce: { $regex: keywords, $options: 'i' } },
        { createdBy: { $regex: keywords, $options: 'i' } },
        { assignedToUserName: { $regex: keywords, $options: 'i' } }
      ];
    }

    // Classification search
    if (classification) {
      match.classification = classification;
    }

    // Closed status search
    if (closed !== undefined) {
      match.closed = closed === 'true'; // Convert string to boolean
    }

    // Age of bug search
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight

    const pastMaximumDaysOld = new Date(today);
    pastMaximumDaysOld.setDate(pastMaximumDaysOld.getDate() - maxAge);

    const pastMinimumDaysOld = new Date(today);
    pastMinimumDaysOld.setDate(pastMinimumDaysOld.getDate() - minAge);

    if (maxAge && minAge) {
      match.createdOn = { $lte: pastMinimumDaysOld, $gte: pastMaximumDaysOld };
    } else if (maxAge) {
      match.createdOn = { $gte: pastMaximumDaysOld };
    } else if (minAge) {
      match.createdOn = { $lte: pastMinimumDaysOld };
    }

    const bugs = await GetAllBugs(match, sortOptions, pageSize, pageNumber);
    res.json(bugs);
  } catch (err) {
    console.error(`Error in GET /bugs: ${err.message}`);
    res.status(500).json({ error: 'Failed to load bugs' });
  }
});

// Get a bug by ID
router.get("/:bugId", isLoggedIn(), validId('bugId'), async (req, res) => {
  const { bugId } = req.params;
  const token = req.cookies.token;
  debugBug('bugId = ' + bugId);

  try {
    const bug = await GetBugById(bugId);
    if (!bug) {
      return res.status(404).json({ error: `Bug ${bugId} not found.` });
    }
    res.json(bug);
  } catch (err) {
    console.error(`Error in GET /bugs/${bugId}: ${err.message}`);
    res.status(500).json({ error: 'Failed to load bug' });
  }
});

// Create a new bug
router.post('', hasPermission('canCreateBug'), validBody(bugSchema), async (req, res) => {
  const auth = req.auth;
  debugBug(`auth object: ${JSON.stringify(auth)}`);
  const bug = req.body;

  try {
    const newBug = {
      ...bug,
      createdOn: new Date(),
      createdBy: auth.name,
      classification: 'Unclassified',
      closed: false,
      comments: [], // Initialize comments as an empty array
    };

    const insertBugResult = await AddBug(newBug);

    // Create a log entry for the new bug
    const log = {
      timestamp: new Date(),
      collection: "bug",
      operation: "insert",
      target: { bugId: insertBugResult.insertedId },
      update: newBug,
      auth: req.auth,
    }
    await saveAuditLog(log);

    res.status(200).json({ message: 'New bug reported!', bugId: insertBugResult.insertedId });
  } catch (error) {
    console.error(`Error in POST /bugs: ${error.message}`);
    res.status(500).json({ error: 'Error adding bug' });
  }
});

//FIXME: not happy with this route, need to refactor, too much logic to make hasPermission work
// Update a bug
router.patch("/:bugId",
  isLoggedIn(),
  validId('bugId'),
  validBody(bugUpdateSchema),
  hasPermission('canEditAnyBug', 'canEditIfAssignedTo', 'canEditMyBug'),  // Ensure user has permission
  async (req, res) => {
    const bugId = req.bugId;
    const auth = req.auth;

    debugBug(`auth object: ${JSON.stringify(auth)}`);

    try {
      // Fetch the current bug
      const currentBug = await GetBugById(bugId);
      if (!currentBug) {
        return res.status(404).json({ error: `Bug ${bugId} not found.` });
      }

      // Get permissions from auth
      const permissions = auth.permissions || {};
      const canEditAnyBug = permissions.canEditAnyBug || false;
      const canEditIfAssignedTo = permissions.canEditIfAssignedTo || false;
      const canEditMyBug = permissions.canEditMyBug || false;

      // Log permissions to debug
      debugBug(`Can edit any bug: ${canEditAnyBug}`);
      debugBug(`Can edit if assigned: ${canEditIfAssignedTo}`);
      debugBug(`Can edit my bug: ${canEditMyBug}`);

      // Check if user can edit this bug based on permissions
      if (
        canEditAnyBug || 
        (canEditIfAssignedTo && currentBug.assignedToUserId === auth._id) ||
        (canEditMyBug && currentBug.createdBy === auth.name)
      ) {
        const updateFields = {
          title: req.body.title || currentBug.title,
          description: req.body.description || currentBug.description,
          stepsToReproduce: req.body.stepsToReproduce || currentBug.stepsToReproduce,
          lastUpdatedBy: auth._id,  // Set only the ID of the user
          lastUpdatedOn: new Date()
        };

        // Perform the update
        const updateResult = await UpdateBug(bugId, { $set: updateFields });
        if (updateResult.modifiedCount === 1) {
          await saveAuditLog({
            timestamp: new Date(),
            collection: "bug",
            operation: "update",
            target: { bugId },
            update: updateFields,
            auth: auth,
          });
          return res.status(200).json({ message: `Bug ${bugId} updated successfully.` });
        } else {
          return res.status(500).json({ error: `An error occurred while updating bug ${bugId}.` });
        }
      } else {
        return res.status(403).json({ error: 'You do not have permission to edit this bug.' });
      }
    } catch (err) {
      console.error(`Error in PATCH /bugs/${bugId}: ${err.message}`);
      res.status(500).json({ error: 'Error updating bug' });
    }
  }
);

// Classify a bug
router.put("/:bugId/classify", 
  isLoggedIn(),
  validId('bugId'),
  validBody(classifyBugSchema),
  hasPermission('canClassifyAnyBug', 'canEditIfAssignedTo', 'canEditMyBug'),  // Ensure user has permissions
  async (req, res) => {
    const { bugId } = req.params;
    const auth = req.auth;

    debugBug(`auth object: ${JSON.stringify(auth)}`);

    try {
      // Fetch the current bug
      const currentBug = await GetBugById(bugId);
      if (!currentBug) {
        return res.status(404).json({ error: `Bug ${bugId} not found.` });
      }

      // Get permissions from auth
      const permissions = auth.permissions || {};
      const canClassifyAnyBug = permissions.canClassifyAnyBug || false;
      const canEditIfAssignedTo = permissions.canEditIfAssignedTo || false;
      const canEditMyBug = permissions.canEditMyBug || false;

      // Log permissions to debug
      debugBug(`Can classify any bug: ${canClassifyAnyBug}`);
      debugBug(`Can edit if assigned: ${canEditIfAssignedTo}`);
      debugBug(`Can edit my bug: ${canEditMyBug}`);

      // Check if user has permission to classify the bug
      if (
        canClassifyAnyBug || 
        (canEditIfAssignedTo && currentBug.assignedToUserId === auth._id) ||
        (canEditMyBug && currentBug.createdBy === auth.name)
      ) {
        const updatedFields = {
          ...req.body,
          dateModified: new Date(),
          ...(currentBug.classifiedOn ? {} : {
            classifiedOn: new Date(),
            classifiedBy: auth,
          }),
        };

        // Perform the classification update
        const result = await ClassifyBug(bugId, updatedFields);
        if (result.modifiedCount === 1) {
          // Save audit log
          const log = {
            timestamp: new Date(),
            collection: "bug",
            operation: "update",
            target: { bugId },
            update: updatedFields,
            auth: auth,
          };
          await saveAuditLog(log);

          return res.status(200).json({ message: `Bug ${bugId} classified successfully.` });
        } else {
          return res.status(500).json({ error: `An error occurred while classifying bug ${bugId}.` });
        }
      } else {
        return res.status(403).json({ error: 'You do not have permission to classify this bug.' });
      }
    } catch (err) {
      console.error(`Error in PUT /bugs/${bugId}/classify: ${err.message}`);
      res.status(500).json({ error: 'Error classifying bug' });
    }
  }
);


// Assign a bug 
//FIXME: Can we do multiple user assignments to one bug?
router.patch("/:bugId/assign", 
  isLoggedIn(), 
  validId('bugId'), 
  validBody(assignBugSchema),
  async (req, res) => {
    const { bugId } = req.params;
    const { assignedToUserId } = req.body;
    const auth = req.auth;

    try {
      // Check if the bug exists
      const currentBug = await GetBugById(bugId);
      if (!currentBug) {
        return res.status(404).json({ error: `Bug ${bugId} not found.` });
      }

      // Check if the assigned user exists
      const db = await connect();
      const assignedUser = await db.collection('Users').findOne({ _id: new ObjectId(assignedToUserId) });
      if (!assignedUser) {
        return res.status(404).json({ error: `User ${assignedToUserId} not found.` });
      }

      // Construct the assigned user name from given and family names
      const assignedToUserName = `${assignedUser.givenName} ${assignedUser.familyName}`;

      // Prepare fields for update
      const updatedFields = {
        assignedToUserId,         // Include the assigned user ID
        assignedToUserName,       // Include the assigned user name
        assignedOn: new Date(),   // Track the assigned timestamp
        assignedBy: auth,         // Track the user who assigned the bug
        lastUpdated: new Date()    // Track the last updated timestamp
      };

      // Update the bug in the database
      const result = await AssignBug(bugId, updatedFields);
      if (result.modifiedCount === 1) {
        // Save the audit log before returning the response
        const log = {
          timestamp: new Date(),
          collection: "bug",
          operation: "update",
          target: { bugId },
          update: updatedFields,
          auth: auth,
        };
        await saveAuditLog(log);

        return res.status(200).json({ message: `Bug ${bugId} assigned to ${assignedToUserName}.` });
      } else {
        return res.status(500).json({ error: `An error occurred while assigning bug ${bugId}.` });
      }
    } catch (error) {
      console.error(`Error in PATCH /bugs/${bugId}/assign: ${error.message}`);
      res.status(500).json({ error: 'Error assigning bug' });
    }
  }
);


// Close a bug
router.patch("/:bugId/close", isLoggedIn(), validId('bugId'), validBody(closeBugSchema), async (req, res) => {
  const bugId = req.bugId;
  const { closed } = req.body;
  const auth = req.auth;

  debugBug(`Bug ID: ${bugId} being closed requested by ${auth}.`);

  try{
    const currentBug = await GetBugById(bugId);
    if (!currentBug) {
      return res.status(404).json({ error: `Bug ${bugId} not found.` });
    }

    const closedStatus = closed === 'true'; // Convert string to boolean
    const updatedFields = {
      closed: closedStatus,
      closedOn: closedStatus ? new Date() : null, // Set date if closed, otherwise null
      closedBy: closedStatus ? auth : null,
      lastUpdated: new Date()
    };

    debugBug('Updated fields: ' + JSON.stringify(updatedFields));

    const result = await CloseBug(bugId, updatedFields);

    if (result.modifiedCount === 1){
      const log = {
        timestamp: new Date(),
        collection: "bug",
        operation: "update",
        target: { bugId },
        update: updatedFields,
        auth: auth
      }
      await saveAuditLog(log);

      const action = closedStatus ? "closed" : "reopened";
      debugBug(`Bug ${bugId} ${action} successfully.`);

      return res.status(200).json({ message: `Bug ${bugId} ${action} successfully.` });
    }else{
      debugBug(`Error closing bug ${bugId}.`);
      return res.status(500).json({ error: `An error occurred while closing bug ${bugId}. No changes made.` });
    }
  }catch(err){
    debugBug('Error closing bug:', err);
    console.error('Error closing bug:', err);
    return res.status(500).json({ error: 'An error occurred while closing the bug.' });
  }
});

// Log hours for a bug
router.post("/:bugId/log-hours", isLoggedIn(), validId('bugId'), validBody(logHoursSchema), async (req, res) => {
  const bugId = req.bugId;
  const { hours, version, dateFixed, notes } = req.body;
  const auth = req.auth;

  try {
    const currentBug = await GetBugById(bugId);
    if (!currentBug) {
      return res.status(404).json({ error: `Bug ${bugId} not found.` });
    }

    const logEntry = {
      hours,
      version,
      dateFixed,
      notes,
      loggedBy: auth.name,
      loggedOn: new Date()
    };

    const updateResult = await UpdateBug(bugId, { $push: { timeLogs: logEntry } });

    if (updateResult.modifiedCount === 1) {
      const log = {
        timestamp: new Date(),
        collection: "bug",
        operation: "update",
        target: { bugId },
        update: { timeLogs: logEntry },
        auth: auth
      };
      await saveAuditLog(log);

      return res.status(200).json({ message: `Hours logged successfully for bug ${bugId}.` });
    } else {
      return res.status(500).json({ error: `An error occurred while logging hours for bug ${bugId}.` });
    }
  } catch (err) {
    console.error(`Error in POST /bugs/${bugId}/log-hours: ${err.message}`);
    return res.status(500).json({ error: 'Error logging hours.' });
  }
});

// Get bugs authored by or assigned to the logged-in user
router.get('/my-bugs', isLoggedIn(), hasPermission('canViewData'), async (req, res) => {
  try {
    const userId = req.user.id;
    const bugs = await Bug.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }]
    });
    res.json(bugs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load bugs' });
  }
});

export { router as bugRouter };