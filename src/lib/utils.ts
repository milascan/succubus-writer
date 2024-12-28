import { pack as en, unpack as de } from "msgpackr";

export const encode = (data: unknown) => new Uint8Array(en(data));
export const decode = (buffer: Uint8Array) => de(buffer);

export const request_data = async (request: Request) => {
  const buffer = await request.arrayBuffer();
  return decode(new Uint8Array(buffer));
};

export const transfer = (data: unknown) =>
  new Response(encode(data), {
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
