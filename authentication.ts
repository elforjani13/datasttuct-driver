export class Auth {
    private url: string;
    private password: string;
  
    constructor(url: string, password: string) {
      this.url = url;
      this.password = password;
    }
  
    public async getToken(): Promise<any> {
      try {
        const response = await fetch(`${this.url}/auth`, {
          method: "POST",
          body: new URLSearchParams({ password: this.password }),
        });
        if (!response.ok) {
          throw new Error(`Filed to authenticate: ${response.statusText}`);
        }
  
        const json = await response.json();
        return json["data"] ?? null;
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    }
  }
  