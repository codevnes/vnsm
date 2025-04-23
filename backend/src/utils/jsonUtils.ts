/**
 * Converts BigInt values to strings to make the object serializable by JSON.stringify
 * 
 * @param data The data that needs to be made JSON-serializable
 * @returns A new object with BigInt values converted to strings
 */
export function serializeBigInt<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeBigInt(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializeBigInt((data as Record<string, any>)[key]);
      }
    }
    return result as T;
  }

  return data;
} 