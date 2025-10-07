import express from 'express';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import Joi from 'joi';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';
import { isLoggedIn, hasPermission } from '@merlin4/express-auth';
import { GetBugById, AddTest, GetAllTests, GetTestById, UpdateTest, DeleteTest, connect, saveAuditLog } from '../../database.js';

const router = express.Router();
const debugTest = debug('app:TestRouter');
router.use(express.urlencoded({ extended: false }));

// Joi schema imports
import { testSchema, testUpdateSchema, testIdSchema } from '../../schema/testSchema.js';

// API routes

// List all tests for a specific bug
router.get('/:bugId/tests', hasPermission('canViewData'), validId('bugId'), async (req, res) => {
  const bugId = req.bugId; // Use validId middleware to set req.bugId
  const auth = req.auth;

  try {
    const bug = await GetBugById(bugId);
    if (!bug) {
      return res.status(404).json({ error: `Bug ${bugId} not found.` });
    }

    const tests = await GetAllTests();
    const bugIdString = bugId.toString(); // Convert ObjectId to string
    const bugTests = tests.filter(test => test.bugId.toString() === bugIdString); // Filter tests based on bugId

    return res.status(200).json(bugTests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error fetching tests.' });
  }
});

// Get a single test by ID
router.get('/:bugId/tests/:testId', hasPermission('canViewData'), validId('testId'), async (req, res) => {
  const testId = req.testId;

  try {
    const test = await GetTestById(testId);
    if (!test) {
      return res.status(404).json({ error: `Test ${testId} not found.` });
    }
    return res.status(200).json(test);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error fetching test.' });
  }
});

// Add a new test to a bug
router.post('/:bugId/tests', hasPermission('canAddTestCase'), validId('bugId'), validBody(testSchema), async (req, res) => {
  const bugId = req.bugId;
  const { title, description, status } = req.body;
  const auth = req.auth;

  try {
    const bug = await GetBugById(bugId);
    if (!bug) {
      return res.status(404).json({ error: `Bug ${bugId} not found.` });
    }

    const newTest = {
      bugId,
      title,
      description,
      status,
      createdOn: new Date(),
      createdBy: auth.name,
    };

    const result = await AddTest(newTest);

    if (result.insertedId) {
      const log = {
        timestamp: new Date(),
        collection: "test",
        operation: "insert",
        target: { bugId },
        update: newTest,
        author: auth.name
      }
      await saveAuditLog(log);
      return res.status(201).json({ message: 'New test added!', testId: result.insertedId });
    } else {
      return res.status(500).json({ error: 'Error adding test.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update an existing test
router.patch('/:bugId/tests/:testId', hasPermission('canEditTestCase'), validId('bugId'), validId('testId'), validBody(testUpdateSchema), async (req, res) => {
  const { bugId, testId } = req;
  const auth = req.auth;

  try {
    const currentTest = await GetTestById(testId);
    if (!currentTest) {
      return res.status(404).json({ error: `Test ${testId} not found.` });
    }

    const updatedTest = { ...currentTest, ...req.body };

    const result = await UpdateTest(updatedTest);

    if (result.modifiedCount > 0) {
      const log = {
        timestamp: new Date(),
        collection: "test",
        operation: "update",
        target: { bugId },
        update: updatedTest,
        auth: auth
      }
      await saveAuditLog(log);

      return res.status(200).json({ message: `Test ${testId} updated successfully.`, testId: testId });
    } else {
      return res.status(500).json({ error: 'Error updating test.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete a test
router.delete('/:bugId/tests/:testId', hasPermission('canDeleteTestCase'), validId('testId'), async (req, res) => {
  const { testId, bugId } = req.params;
  const auth = req.auth;

  try {
    const test = await GetTestById(testId);
    if (!test) {
      return res.status(404).json({ error: `Test ${testId} not found.` });
    }

    const result = await DeleteTest(testId);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: `Test ${testId} not found.` });
    } else {
      const log = {
        timestamp: new Date(),
        collection: "test",
        operation: "delete",
        target: { testId },
        auth: auth
      }
      await saveAuditLog(log);

      return res.status(200).json({ message: `Test ${testId} deleted!`, testId: testId });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export { router as testRouter };