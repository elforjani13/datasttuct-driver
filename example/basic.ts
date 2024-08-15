import { Client, Tuple, Binary } from "..";
import * as fs from "fs";

const client = new Client(["127.0.0.1", 8080], "TEST@TEST");

if (await client.connect()) {
  const status = await client.set("foo", {
    string: "hey",
    tuple: Tuple.build("PI", 3.14),
    list: [1, 2, 3, 4, 5],
    dict: { foo: "bar" },
    number: 1314,
    boolean: false,
    binary: new Binary(
      new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
    ),
  });

  console.log("Status:", status);

  const result = await client.get("foo");

  console.log(result);
}
