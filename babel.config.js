/**
 * Babel Configuration for Jest Tests
 *
 * This config is used when running Jest directly (not through react-scripts)
 *
 * @since 2025-12-19
 */

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
