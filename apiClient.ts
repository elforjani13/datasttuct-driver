import { Auth } from "./authentication";
import { ObjectToType, TypeToString } from "./dataModels";

export class Client {
  private serviceUrl: string;
  private servicePassword: string;
  private available: boolean = false;
  private token: string | null = null;
  private groupName: string;

  constructor(
    [host, port]: [string, number],
    password: string,
    useHttps: boolean = false,
    defaultGroup: string = "default"
  ) {
    const protocol = useHttps ? "https://" : "http://";
    this.serviceUrl = `${protocol}${host}:${port}`;
    this.servicePassword = password;
    this.groupName = defaultGroup;
  }

  /**
   * Establishes a connection to the service.
   *
   * @return {boolean} Whether the connection was successful.
   */
  public async connect(): Promise<boolean> {
    const auth = new Auth(this.serviceUrl, this.servicePassword);
    this.token = await auth.getToken();

    this.available = Boolean(this.token);
    return this.available;
  }

  /**
   * Selects a group for the client.
   *
   * @param {string} group - The name of the group to select.
   * @return {void} No return value.
   */
  public select(group: string) {
    this.groupName = group;
  }

  /**
   * Executes a command on the service.
   *
   * @param {string} command - The command to execute.
   * @return {Promise<null | string>} The result of the command execution, or null if the operation failed.
   */
  public async execute(command: string): Promise<null | string> {
    if (!this.available) {
      throw new Error("Not connected");
    }

    const url = `${this.serviceUrl}/${this.groupName}/execute`;
    const headers = new Headers({
      Authorization: `Bearer ${this.token}`,
    });
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: new URLSearchParams({
        query: command,
        style: "json",
      }),
    });

    if (response.status === 401) {
      const auth = new Auth(this.serviceUrl, this.servicePassword);
      this.token = await auth.getToken();
      return this.token ? this.execute(command) : null;
    }
    if (!response.ok) {
      return null;
    }
    try {
      const json = await response.json();
      return json.alpha === "Ok" ? json.data.reply : null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves a value associated with the given key.
   *
   * @param {string} key - The key to retrieve the value for.
   * @return {any} The value associated with the key, or null if not found.
   */
  public async get(key: string): Promise<any> {
    const result = await this.execute(`get ${key}`);
    if (!result) return null;

    try {
      return ObjectToType(JSON.parse(result));
    } catch {
      return null;
    }
  }

  /**
   * Sets a value associated with the given key.
   *
   * @param {string} key - The key to set.
   * @param {any} value - The value to set.
   * @param {number} expire - The expiration time of the value (default: 0).
   * @return {boolean} Whether the operation was successful.
   */
  public async set(
    key: string,
    value: any,
    expire: number = 0
  ): Promise<boolean> {
    const data = TypeToString(value);
    const command = `set ${key} b:${btoa(data)}: ${expire}`;
    const result = await this.execute(command);
    return result !== null;
  }

  /**
   * Deletes the value associated with the given key.
   *
   * @param {string} key - The key to delete.
   * @return {boolean} Whether the operation was successful.
   */
  public async delete(key: string): Promise<boolean> {
    const result = await this.execute(`delete ${key}`);
    return result !== null;
  }

  /**
   * Removes all data from the current group.
   *
   * @return {boolean} Whether the operation was successful
   */
  public async clean(): Promise<boolean> {
    const result = await this.execute(`clean`);
    return result !== null;
  }
}
