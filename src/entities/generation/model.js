// [FSD Layer: entities] — Core domain models defining generation tasks, statuses, and studio modes.

/**
 * @typedef {'pending' | 'processing' | 'completed' | 'failed' | 'error'} GenerationStatus
 */

/**
 * @typedef {'image' | 'cinema'} StudioMode
 */

/**
 * @typedef {Object} GenerationNode
 * @property {string} id
 * @property {GenerationStatus} status
 * @property {string} model
 * @property {string} [image_url]
 * @property {string} [video_url]
 * @property {string} [edit_command]
 * @property {string} [description]
 * @property {string} [timestamp]
 */

export const GENERATION_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ERROR: 'error'
};
