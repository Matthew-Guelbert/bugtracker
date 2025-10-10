import express from 'express';
import { ObjectId } from 'mongodb';
import debug from 'debug';
import Joi from 'joi';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';
import { isLoggedIn, hasPermission } from '@merlin4/express-auth';
import { GetBugById, AddComment, GetAllComments, GetCommentById, connect, UpdateBug } from '../../database.js';

const router = express.Router();
const debugComment = debug('app:CommentRouter');
router.use(express.urlencoded({ extended: false }));

// Joi schema imports
import { commentSchema } from '../../schema/commentSchema.js';

// API routes

// List all comments for a specific bug
router.get('/:bugId/comments', isLoggedIn(), validId('bugId'), async (req, res) => {
  const bugId = req.bugId;
  const auth = req.auth;

  try{
    const bug = await GetBugById(bugId);
    if (!bug) {
      return res.status(404).json({ error: `Bug ${bugId} not found.` });
    }

    // Sort the comments by 'createdOn' field in ascending order (oldest to newest)
    const sortedComments = bug.comments?.sort((a, b) => new Date(a.createdOn) - new Date(b.createdOn)) || [];

    debugComment(`Bug ${bugId} has ${sortedComments.length} comments.`);

    return res.status(200).json(sortedComments);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Error fetching comments.' });
  }
});

// Get a single comment by ID
router.get('/:bugId/comments/:commentId', isLoggedIn(), validId('bugId'), validId('commentId'), async (req, res) => {
  const bugId = req.bugId;
  const commentId = req.commentId;

  try {
    const bug = await GetBugById(bugId);
    if (!bug) {
      return res.status(404).json({ error: `Bug ${bugId} not found.` });
    }

    // Ensure comments array exists and search for the comment by ID
    const comment = bug.comments?.find(comment => comment._id && comment._id.equals(commentId));
    if (!comment) {
      return res.status(404).json({ error: `Comment ${commentId} not found.` });
    }

    return res.status(200).json(comment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error fetching comment.' });
  }
});


// Add a new comment to a bug
router.post('/:bugId/comments', isLoggedIn(), validId('bugId'), validBody(commentSchema), async (req, res) => {
  const bugId = req.bugId;
  const auth = req.auth;
  const { text } = req.body;

  try {
    const newComment = {
      _id: new ObjectId(), // Generate a new ObjectId for the comment
      author: auth.name,
      text,
      createdOn: new Date(),
    };

    // Update the bug by pushing the new comment into the comments array
    const result = await UpdateBug(bugId, { $push: { comments: newComment } });

    // Check if the comment was successfully added
    if (result.modifiedCount > 0) {
      return res.status(200).json({ message: 'Comment added!', commentId: newComment._id });
    } else {
      return res.status(500).json({ error: 'Error adding comment.' });
    }
  } catch (err) {
    console.error(`Error in POST /:bugId/comments: ${err.message}`);
    return res.status(500).json({ error: 'Error adding comment.' });
  }
});

export { router as commentRouter };