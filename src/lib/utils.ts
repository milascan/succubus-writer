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

export const valid = (...data: unknown[]) =>
  data.every((d) => d !== undefined && d !== null);

export const array_to_poped = <T>(ary: T[]): [T[], T | undefined] => {
  return [ary.slice(0, ary.length - 1), ary.at(-1)];
};

export const array_delete = <T>(ary: T[], value: T) => {
  const res = ary.indexOf(value);
  if (res !== -1) return ary.splice(res, 1);
  return [];
};