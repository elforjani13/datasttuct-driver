export class Binary {
    private inner: Uint8Array;
  
    constructor(data: Uint8Array) {
      this.inner = data;
    }
  
    /**
     * Returns a string representation of the binary data.
     *
     * @return {string} A base64-encoded string prefixed with 'binary!'
     */
    public stringify(): string {
      const base64String = btoa(String.fromCharCode(...this.inner));
      return `binary!(${base64String})`;
    }
  
    /**
     * Creates a new Binary instance from a base64-encoded string.
     *
     * @param {string} value - The base64-encoded string to convert.
     * @return {Binary} A new Binary instance containing the decoded data.
     */
    public static fromBase64(value: string): Binary {
      const data = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
      return new Binary(data);
    }
  }
  
  export class Tuple<T, U> {
    private items: [T, U];
  
    constructor(first: any, second: any) {
      this.items = [first, second];
    }
  
    public first(): T;
    public first(value: T): void;
    public first(value?: T): T | void {
      if (value == undefined) {
        return this.items[0];
      }
      this.items[0] = value;
    }
  
    public second(): U;
    public second(value: U): void;
    public second(value?: U): U | void {
      if (value == undefined) {
        return this.items[1];
      }
      this.items[1] = value;
    }
  
    public toArray(): [T, U] {
      return this.items;
    }
  
    public toString(): string {
      return `(${this.items[0]}, ${this.items[1]})`;
    }
  
    public static build<T, U>(first: T, second: U): Tuple<T, U> {
      return new Tuple(first, second);
    }
  }
  
  type TypeHandlers = {
    [key: string]: (data: any) => any;
  };
  
  const handlers: TypeHandlers = {
    String: (data: any) => String(data),
    Number: (data: any) => Number(data),
    Boolean: parseBoolean,
    List: (data: any) => data.map(ObjectToType),
    Tuple: (data: any) =>
      Object.fromEntries(
        Object.entries(data).map(([subKey, subValue]) => [
          subKey,
          ObjectToType(subValue),
        ])
      ),
    Binary: (data: any) => new Binary(data["data"]),
  };
  
  /**
   * Converts an object to a specific type based on a predefined handler.
   *
   * @param {any} value - The object to be converted.
   * @return {any} The converted value, or null if no handler is found.
   */
  export function ObjectToType(value: any): any {
    const [key, data] = Object.entries(value)[0];
    const handler = handlers[key];
  
    if (handler) {
      return handler(data);
    }
  
    return null;
  }
  
  /**
   * Converts a given value to a string representation.
   *
   * @param {any} value - The value to be converted.
   * @return {string} A string representation of the given value.
   */
  export function TypeToString(value: any): string {
    if (typeof value === "string") {
      return `"${value}"`;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map(TypeToString).join(", ")}]`;
    }
    if (value instanceof Tuple) {
      return `(${value.toArray().map(TypeToString).join(", ")})`;
    }
    if (value instanceof Binary) {
      return value.stringify();
    }
    if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value)
        .map(([key, val]) => `"${key}":${TypeToString(val)}`)
        .join(", ");
      return `{${entries}}`;
    }
    return "";
  }
  
  /**
   * Converts a given value to a boolean representation.
   *
   * @param {any} data - The value to be converted.
   * @return {boolean | null} The boolean representation of the given value, or null if the conversion fails.
   */
  function parseBoolean(data: any): boolean | null {
    if (typeof data == "boolean") return data;
    if (typeof data == "string") return data.toUpperCase() == "TRUE";
    return null;
  }
  