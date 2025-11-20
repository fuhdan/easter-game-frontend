/**
 * Module: validators/configValidator.js
 * Purpose: System configuration validation and type conversion
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - Type validation (int, float, bool, string)
 * - Range validation (min/max constraints)
 * - Type conversion with proper parsing
 * - Boolean value normalization
 *
 * @since 2025-11-20
 */

/**
 * Configuration value types supported by the system
 */
export const CONFIG_VALUE_TYPES = {
  INT: 'int',
  FLOAT: 'float',
  BOOL: 'bool',
  STRING: 'string'
};

/**
 * Validate configuration value based on type and constraints
 *
 * Performs type-specific validation and checks min/max constraints where applicable.
 * Returns null if valid, or an error message string if invalid.
 *
 * @param {string} value - Value to validate (always string from input)
 * @param {string} valueType - Value type (int, float, bool, string)
 * @param {Object} config - Configuration object with constraints
 * @param {number|null} [config.min_value] - Minimum allowed value (for int/float)
 * @param {number|null} [config.max_value] - Maximum allowed value (for int/float)
 * @returns {string|null} Error message if invalid, null if valid
 *
 * @example
 * // Integer validation
 * validateValue('42', 'int', { min_value: 0, max_value: 100 })
 * // Returns: null (valid)
 *
 * @example
 * // Invalid integer
 * validateValue('abc', 'int', {})
 * // Returns: 'Value must be an integer'
 *
 * @example
 * // Out of range
 * validateValue('150', 'int', { min_value: 0, max_value: 100 })
 * // Returns: 'Value must be <= 100'
 *
 * @example
 * // Boolean validation
 * validateValue('true', 'bool', {})
 * // Returns: null (valid)
 *
 * @example
 * // Invalid boolean
 * validateValue('maybe', 'bool', {})
 * // Returns: 'Value must be true/false or 1/0'
 */
export function validateValue(value, valueType, config) {
  // SECURITY: Validate inputs to prevent injection or invalid data
  if (typeof value !== 'string' && typeof value !== 'number') {
    return 'Invalid value type';
  }

  const stringValue = String(value);

  // Type-specific validation
  switch (valueType) {
    case CONFIG_VALUE_TYPES.INT:
      return validateInteger(stringValue, config);

    case CONFIG_VALUE_TYPES.FLOAT:
      return validateFloat(stringValue, config);

    case CONFIG_VALUE_TYPES.BOOL:
      return validateBoolean(stringValue);

    case CONFIG_VALUE_TYPES.STRING:
      return validateString(stringValue, config);

    default:
      return `Unknown value type: ${valueType}`;
  }
}

/**
 * Validate integer value with range constraints
 *
 * @param {string} value - String value to validate
 * @param {Object} config - Configuration object with min/max constraints
 * @returns {string|null} Error message or null if valid
 *
 * @private
 */
function validateInteger(value, config) {
  const intValue = parseInt(value, 10);

  if (isNaN(intValue)) {
    return 'Value must be an integer';
  }

  // Check if string representation matches parsed value (catches "42.5" → 42)
  if (value.trim() !== String(intValue)) {
    return 'Value must be a whole number (no decimals)';
  }

  // Min/max validation
  if (config.min_value !== null && config.min_value !== undefined) {
    if (intValue < config.min_value) {
      return `Value must be >= ${config.min_value}`;
    }
  }

  if (config.max_value !== null && config.max_value !== undefined) {
    if (intValue > config.max_value) {
      return `Value must be <= ${config.max_value}`;
    }
  }

  return null;
}

/**
 * Validate float value with range constraints
 *
 * @param {string} value - String value to validate
 * @param {Object} config - Configuration object with min/max constraints
 * @returns {string|null} Error message or null if valid
 *
 * @private
 */
function validateFloat(value, config) {
  const floatValue = parseFloat(value);

  if (isNaN(floatValue)) {
    return 'Value must be a number';
  }

  // Min/max validation
  if (config.min_value !== null && config.min_value !== undefined) {
    if (floatValue < config.min_value) {
      return `Value must be >= ${config.min_value}`;
    }
  }

  if (config.max_value !== null && config.max_value !== undefined) {
    if (floatValue > config.max_value) {
      return `Value must be <= ${config.max_value}`;
    }
  }

  return null;
}

/**
 * Validate boolean value
 *
 * Accepts: true, false, 1, 0 (case-insensitive)
 *
 * @param {string} value - String value to validate
 * @returns {string|null} Error message or null if valid
 *
 * @private
 */
function validateBoolean(value) {
  const lowerValue = value.toLowerCase().trim();

  if (!['true', 'false', '1', '0'].includes(lowerValue)) {
    return 'Value must be true/false or 1/0';
  }

  return null;
}

/**
 * Validate string value
 *
 * Currently accepts any string. Can be extended with length constraints.
 *
 * @param {string} value - String value to validate
 * @param {Object} config - Configuration object (for future constraints)
 * @returns {string|null} Error message or null if valid
 *
 * @private
 */
function validateString(value, config) {
  // Future enhancement: Add min_length, max_length, regex pattern
  if (config.min_length && value.length < config.min_length) {
    return `String must be at least ${config.min_length} characters`;
  }

  if (config.max_length && value.length > config.max_length) {
    return `String must be at most ${config.max_length} characters`;
  }

  return null;
}

/**
 * Convert string value to appropriate typed value
 *
 * Converts configuration value from string (UI input) to the correct
 * JavaScript type based on the configuration's value_type field.
 *
 * @param {string} value - String value to convert
 * @param {string} valueType - Target value type (int, float, bool, string)
 * @returns {number|boolean|string} Converted value
 *
 * @example
 * convertToType('42', 'int')       // Returns: 42 (number)
 * convertToType('3.14', 'float')   // Returns: 3.14 (number)
 * convertToType('true', 'bool')    // Returns: true (boolean)
 * convertToType('1', 'bool')       // Returns: true (boolean)
 * convertToType('hello', 'string') // Returns: 'hello' (string)
 *
 * @note Always validate before converting using validateValue()
 */
export function convertToType(value, valueType) {
  switch (valueType) {
    case CONFIG_VALUE_TYPES.INT:
      return parseInt(value, 10);

    case CONFIG_VALUE_TYPES.FLOAT:
      return parseFloat(value);

    case CONFIG_VALUE_TYPES.BOOL:
      return normalizeBooleanValue(value);

    case CONFIG_VALUE_TYPES.STRING:
    default:
      return value;
  }
}

/**
 * Normalize boolean value from various string representations
 *
 * @param {string} value - String boolean value
 * @returns {boolean} JavaScript boolean
 *
 * @example
 * normalizeBooleanValue('true')  // Returns: true
 * normalizeBooleanValue('TRUE')  // Returns: true
 * normalizeBooleanValue('1')     // Returns: true
 * normalizeBooleanValue('false') // Returns: false
 * normalizeBooleanValue('0')     // Returns: false
 *
 * @private
 */
function normalizeBooleanValue(value) {
  const lowerValue = String(value).toLowerCase().trim();
  return lowerValue === 'true' || lowerValue === '1';
}

/**
 * Get human-readable type description
 *
 * @param {string} valueType - Configuration value type
 * @returns {string} Human-readable description
 *
 * @example
 * getTypeDescription('int')    // Returns: 'integer'
 * getTypeDescription('float')  // Returns: 'decimal number'
 * getTypeDescription('bool')   // Returns: 'true/false'
 * getTypeDescription('string') // Returns: 'text'
 */
export function getTypeDescription(valueType) {
  switch (valueType) {
    case CONFIG_VALUE_TYPES.INT:
      return 'integer (whole number)';
    case CONFIG_VALUE_TYPES.FLOAT:
      return 'decimal number';
    case CONFIG_VALUE_TYPES.BOOL:
      return 'true/false or 1/0';
    case CONFIG_VALUE_TYPES.STRING:
      return 'text';
    default:
      return 'value';
  }
}
