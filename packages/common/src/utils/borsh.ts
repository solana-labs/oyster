import { serialize, BinaryReader, Schema, BorshError } from 'borsh';

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function deserializeField(
  schema: Schema,
  fieldName: string,
  fieldType: any,
  reader: BinaryReader,
  optional: boolean,
): any {
  try {
    if (typeof fieldType === 'string') {
      return (reader as any)[`read${capitalizeFirstLetter(fieldType)}`]();
    }

    if (fieldType instanceof Array) {
      if (typeof fieldType[0] === 'number') {
        return reader.readFixedArray(fieldType[0]);
      }

      return reader.readArray(() =>
        deserializeField(schema, fieldName, fieldType[0], reader, false),
      );
    }

    if (fieldType.kind === 'option') {
      const option = reader.readU8();
      if (option) {
        return deserializeField(
          schema,
          fieldName,
          fieldType.type,
          reader,
          false,
        );
      }

      return undefined;
    }

    return deserializeStruct(schema, fieldType, reader);
  } catch (error) {
    if (error instanceof BorshError) {
      error.addToFieldPath(fieldName);
    }
    throw error;
  }
}

function deserializeStruct(
  schema: Schema,
  classType: any,
  reader: BinaryReader,
) {
  const structSchema = schema.get(classType);
  if (!structSchema) {
    throw new BorshError(`Class ${classType.name} is missing in schema`);
  }

  if (structSchema.kind === 'struct') {
    const result: any = {};
    for (const [fieldName, fieldType] of schema.get(classType).fields) {
      result[fieldName] = deserializeField(
        schema,
        fieldName,
        fieldType,
        reader,
        false,
      );
    }
    return new classType(result);
  }

  if (structSchema.kind === 'enum') {
    const idx = reader.readU8();
    if (idx >= structSchema.values.length) {
      throw new BorshError(`Enum index: ${idx} is out of range`);
    }
    const [fieldName, fieldType] = structSchema.values[idx];
    const fieldValue = deserializeField(
      schema,
      fieldName,
      fieldType,
      reader,
      false,
    );
    return new classType({ [fieldName]: fieldValue });
  }

  throw new BorshError(
    `Unexpected schema kind: ${structSchema.kind} for ${classType.constructor.name}`,
  );
}

/// Deserializes object from bytes using schema.
export function deserializeBorsh(
  schema: Schema,
  classType: any,
  buffer: Buffer,
): any {
  const reader = new BinaryReader(buffer);
  return deserializeStruct(schema, classType, reader);
}
