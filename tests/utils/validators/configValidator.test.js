/**
 * Module: configValidator.test.js
 * Purpose: Tests for configuration validation utilities
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import {
  CONFIG_VALUE_TYPES,
  validateValue,
  convertToType,
  getTypeDescription
} from '../../../src/utils/validators/configValidator';

describe('configValidator', () => {
  describe('CONFIG_VALUE_TYPES', () => {
    test('exports all value types', () => {
      expect(CONFIG_VALUE_TYPES.INT).toBe('int');
      expect(CONFIG_VALUE_TYPES.FLOAT).toBe('float');
      expect(CONFIG_VALUE_TYPES.BOOL).toBe('bool');
      expect(CONFIG_VALUE_TYPES.STRING).toBe('string');
    });
  });

  describe('validateValue - integer', () => {
    test('validates valid integer', () => {
      expect(validateValue('42', 'int', {})).toBeNull();
      expect(validateValue('0', 'int', {})).toBeNull();
      expect(validateValue('-100', 'int', {})).toBeNull();
    });

    test('rejects non-integer values', () => {
      expect(validateValue('abc', 'int', {})).toBe('Value must be an integer');
      expect(validateValue('', 'int', {})).toBe('Value must be an integer');
      expect(validateValue('12.5', 'int', {})).toBe('Value must be a whole number (no decimals)');
    });

    test('enforces minimum value constraint', () => {
      expect(validateValue('5', 'int', { min_value: 10 })).toBe('Value must be >= 10');
      expect(validateValue('10', 'int', { min_value: 10 })).toBeNull();
      expect(validateValue('15', 'int', { min_value: 10 })).toBeNull();
    });

    test('enforces maximum value constraint', () => {
      expect(validateValue('150', 'int', { max_value: 100 })).toBe('Value must be <= 100');
      expect(validateValue('100', 'int', { max_value: 100 })).toBeNull();
      expect(validateValue('50', 'int', { max_value: 100 })).toBeNull();
    });

    test('enforces both min and max constraints', () => {
      const config = { min_value: 0, max_value: 100 };
      expect(validateValue('-1', 'int', config)).toBe('Value must be >= 0');
      expect(validateValue('0', 'int', config)).toBeNull();
      expect(validateValue('50', 'int', config)).toBeNull();
      expect(validateValue('100', 'int', config)).toBeNull();
      expect(validateValue('101', 'int', config)).toBe('Value must be <= 100');
    });

    test('handles whitespace in integer values', () => {
      expect(validateValue('  42  ', 'int', {})).toBeNull();
    });

    test('handles null/undefined constraints', () => {
      expect(validateValue('42', 'int', { min_value: null, max_value: null })).toBeNull();
      expect(validateValue('42', 'int', { min_value: undefined, max_value: undefined })).toBeNull();
    });
  });

  describe('validateValue - float', () => {
    test('validates valid float', () => {
      expect(validateValue('3.14', 'float', {})).toBeNull();
      expect(validateValue('0.5', 'float', {})).toBeNull();
      expect(validateValue('-2.718', 'float', {})).toBeNull();
      expect(validateValue('42', 'float', {})).toBeNull(); // Integer is valid float
    });

    test('rejects non-numeric values', () => {
      expect(validateValue('abc', 'float', {})).toBe('Value must be a number');
      expect(validateValue('', 'float', {})).toBe('Value must be a number');
    });

    test('enforces minimum value constraint', () => {
      expect(validateValue('0.5', 'float', { min_value: 1.0 })).toBe('Value must be >= 1');
      expect(validateValue('1.0', 'float', { min_value: 1.0 })).toBeNull();
      expect(validateValue('2.5', 'float', { min_value: 1.0 })).toBeNull();
    });

    test('enforces maximum value constraint', () => {
      expect(validateValue('150.5', 'float', { max_value: 100.0 })).toBe('Value must be <= 100');
      expect(validateValue('100.0', 'float', { max_value: 100.0 })).toBeNull();
      expect(validateValue('50.5', 'float', { max_value: 100.0 })).toBeNull();
    });

    test('enforces both min and max constraints', () => {
      const config = { min_value: 0.0, max_value: 1.0 };
      expect(validateValue('-0.1', 'float', config)).toBe('Value must be >= 0');
      expect(validateValue('0.0', 'float', config)).toBeNull();
      expect(validateValue('0.5', 'float', config)).toBeNull();
      expect(validateValue('1.0', 'float', config)).toBeNull();
      expect(validateValue('1.1', 'float', config)).toBe('Value must be <= 1');
    });

    test('handles null/undefined constraints', () => {
      expect(validateValue('3.14', 'float', { min_value: null, max_value: null })).toBeNull();
      expect(validateValue('3.14', 'float', { min_value: undefined, max_value: undefined })).toBeNull();
    });
  });

  describe('validateValue - boolean', () => {
    test('validates "true"', () => {
      expect(validateValue('true', 'bool', {})).toBeNull();
      expect(validateValue('TRUE', 'bool', {})).toBeNull();
      expect(validateValue('True', 'bool', {})).toBeNull();
    });

    test('validates "false"', () => {
      expect(validateValue('false', 'bool', {})).toBeNull();
      expect(validateValue('FALSE', 'bool', {})).toBeNull();
      expect(validateValue('False', 'bool', {})).toBeNull();
    });

    test('validates "1" as true', () => {
      expect(validateValue('1', 'bool', {})).toBeNull();
    });

    test('validates "0" as false', () => {
      expect(validateValue('0', 'bool', {})).toBeNull();
    });

    test('rejects invalid boolean values', () => {
      expect(validateValue('yes', 'bool', {})).toBe('Value must be true/false or 1/0');
      expect(validateValue('no', 'bool', {})).toBe('Value must be true/false or 1/0');
      expect(validateValue('maybe', 'bool', {})).toBe('Value must be true/false or 1/0');
      expect(validateValue('2', 'bool', {})).toBe('Value must be true/false or 1/0');
      expect(validateValue('', 'bool', {})).toBe('Value must be true/false or 1/0');
    });

    test('handles whitespace in boolean values', () => {
      expect(validateValue('  true  ', 'bool', {})).toBeNull();
      expect(validateValue('  1  ', 'bool', {})).toBeNull();
    });
  });

  describe('validateValue - string', () => {
    test('validates any string by default', () => {
      expect(validateValue('hello', 'string', {})).toBeNull();
      expect(validateValue('', 'string', {})).toBeNull();
      expect(validateValue('123', 'string', {})).toBeNull();
      expect(validateValue('with spaces', 'string', {})).toBeNull();
    });

    test('enforces minimum length constraint', () => {
      expect(validateValue('abc', 'string', { min_length: 5 })).toBe('String must be at least 5 characters');
      expect(validateValue('abcde', 'string', { min_length: 5 })).toBeNull();
      expect(validateValue('abcdef', 'string', { min_length: 5 })).toBeNull();
    });

    test('enforces maximum length constraint', () => {
      expect(validateValue('abcdefghijk', 'string', { max_length: 10 })).toBe('String must be at most 10 characters');
      expect(validateValue('abcdefghij', 'string', { max_length: 10 })).toBeNull();
      expect(validateValue('abc', 'string', { max_length: 10 })).toBeNull();
    });

    test('enforces both min and max length constraints', () => {
      const config = { min_length: 3, max_length: 10 };
      expect(validateValue('ab', 'string', config)).toBe('String must be at least 3 characters');
      expect(validateValue('abc', 'string', config)).toBeNull();
      expect(validateValue('abcdef', 'string', config)).toBeNull();
      expect(validateValue('abcdefghij', 'string', config)).toBeNull();
      expect(validateValue('abcdefghijk', 'string', config)).toBe('String must be at most 10 characters');
    });
  });

  describe('validateValue - edge cases', () => {
    test('rejects invalid value types', () => {
      expect(validateValue({}, 'int', {})).toBe('Invalid value type');
      expect(validateValue([], 'int', {})).toBe('Invalid value type');
      expect(validateValue(null, 'int', {})).toBe('Invalid value type');
      expect(validateValue(undefined, 'int', {})).toBe('Invalid value type');
    });

    test('accepts number input (converts to string)', () => {
      expect(validateValue(42, 'int', {})).toBeNull();
      expect(validateValue(3.14, 'float', {})).toBeNull();
    });

    test('rejects unknown value type', () => {
      expect(validateValue('test', 'unknown_type', {})).toBe('Unknown value type: unknown_type');
    });
  });

  describe('convertToType', () => {
    describe('integer conversion', () => {
      test('converts string to integer', () => {
        expect(convertToType('42', 'int')).toBe(42);
        expect(convertToType('0', 'int')).toBe(0);
        expect(convertToType('-100', 'int')).toBe(-100);
      });

      test('converts string with leading zeros', () => {
        expect(convertToType('007', 'int')).toBe(7);
      });
    });

    describe('float conversion', () => {
      test('converts string to float', () => {
        expect(convertToType('3.14', 'float')).toBe(3.14);
        expect(convertToType('0.5', 'float')).toBe(0.5);
        expect(convertToType('-2.718', 'float')).toBe(-2.718);
      });

      test('converts integer string to float', () => {
        expect(convertToType('42', 'float')).toBe(42);
      });
    });

    describe('boolean conversion', () => {
      test('converts "true" to boolean', () => {
        expect(convertToType('true', 'bool')).toBe(true);
        expect(convertToType('TRUE', 'bool')).toBe(true);
        expect(convertToType('True', 'bool')).toBe(true);
      });

      test('converts "false" to boolean', () => {
        expect(convertToType('false', 'bool')).toBe(false);
        expect(convertToType('FALSE', 'bool')).toBe(false);
        expect(convertToType('False', 'bool')).toBe(false);
      });

      test('converts "1" to true', () => {
        expect(convertToType('1', 'bool')).toBe(true);
      });

      test('converts "0" to false', () => {
        expect(convertToType('0', 'bool')).toBe(false);
      });

      test('handles whitespace in boolean values', () => {
        expect(convertToType('  true  ', 'bool')).toBe(true);
        expect(convertToType('  false  ', 'bool')).toBe(false);
        expect(convertToType('  1  ', 'bool')).toBe(true);
      });

      test('handles numeric boolean input', () => {
        expect(convertToType(1, 'bool')).toBe(true);
        expect(convertToType(0, 'bool')).toBe(false);
      });
    });

    describe('string conversion', () => {
      test('returns string as-is', () => {
        expect(convertToType('hello', 'string')).toBe('hello');
        expect(convertToType('', 'string')).toBe('');
        expect(convertToType('123', 'string')).toBe('123');
      });
    });

    describe('unknown type conversion', () => {
      test('returns value as-is for unknown type', () => {
        expect(convertToType('test', 'unknown')).toBe('test');
      });
    });
  });

  describe('getTypeDescription', () => {
    test('returns description for integer', () => {
      expect(getTypeDescription('int')).toBe('integer (whole number)');
    });

    test('returns description for float', () => {
      expect(getTypeDescription('float')).toBe('decimal number');
    });

    test('returns description for boolean', () => {
      expect(getTypeDescription('bool')).toBe('true/false or 1/0');
    });

    test('returns description for string', () => {
      expect(getTypeDescription('string')).toBe('text');
    });

    test('returns generic description for unknown type', () => {
      expect(getTypeDescription('unknown')).toBe('value');
    });
  });

  describe('integration tests', () => {
    test('full workflow: validate then convert integer', () => {
      const value = '42';
      const valueType = 'int';
      const config = { min_value: 0, max_value: 100 };

      const error = validateValue(value, valueType, config);
      expect(error).toBeNull();

      const converted = convertToType(value, valueType);
      expect(converted).toBe(42);
      expect(typeof converted).toBe('number');
    });

    test('full workflow: validate then convert float', () => {
      const value = '3.14';
      const valueType = 'float';
      const config = { min_value: 0.0, max_value: 10.0 };

      const error = validateValue(value, valueType, config);
      expect(error).toBeNull();

      const converted = convertToType(value, valueType);
      expect(converted).toBe(3.14);
      expect(typeof converted).toBe('number');
    });

    test('full workflow: validate then convert boolean', () => {
      const value = 'true';
      const valueType = 'bool';
      const config = {};

      const error = validateValue(value, valueType, config);
      expect(error).toBeNull();

      const converted = convertToType(value, valueType);
      expect(converted).toBe(true);
      expect(typeof converted).toBe('boolean');
    });

    test('full workflow: validate then convert string', () => {
      const value = 'test string';
      const valueType = 'string';
      const config = { min_length: 5, max_length: 20 };

      const error = validateValue(value, valueType, config);
      expect(error).toBeNull();

      const converted = convertToType(value, valueType);
      expect(converted).toBe('test string');
      expect(typeof converted).toBe('string');
    });

    test('validation fails before conversion', () => {
      const value = '150';
      const valueType = 'int';
      const config = { min_value: 0, max_value: 100 };

      const error = validateValue(value, valueType, config);
      expect(error).toBe('Value must be <= 100');

      // Should not convert invalid value, but if you do:
      const converted = convertToType(value, valueType);
      expect(converted).toBe(150); // Converts anyway, validation is separate
    });
  });
});
