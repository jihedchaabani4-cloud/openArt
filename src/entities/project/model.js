// [FSD Layer: entities] — Core domain models relating to the user's Projects and Sessions.

/**
 * @typedef {Object} Project
 * @property {string} project_id
 * @property {string} project_name
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} Session
 * @property {string} session_id
 * @property {string} project_id
 * @property {string} session_name
 * @property {string} [thumbnail]
 * @property {string} [created_at]
 */

export const PROJECT_ENTITIES_INITIALIZED = true;
