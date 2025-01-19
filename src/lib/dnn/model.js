import * as ort from "./ort.min.js";
import {
  dict_chars,
  dict_idxs,
  idx_fill_e,
  idx_ime_e,
  idx_ime_s,
  idx_offset,
  idx_unknown,
  idx_valid,
  input_len,
  max_len,
} from "./model-config.json" with { type: "json" };
export { max_len };

ort.env.wasm.wasmPaths = "/onnx/";
ort.env.wasm.numThreads = 1;

function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const scores = logits.map((l) => Math.exp(l - maxLogit));
  const denom = scores.reduce((a, b) => a + b);
  return scores.map((s) => s / denom);
}

const delimiters = /[。！？「」『』“”‘’（）：；，～、\n,.:;?'"()]/;
const remove_chars = /[^\u4e00-\u9fff]/;
const pad_char = "，";

export function slice(str, end) {
  const head = str.slice(0, end);
  let idx = head.length - 1;
  const res = [];
  while (res.length < max_len && idx >= 0) {
    const c = head[idx];
    if (delimiters.test(c) || remove_chars.test(c)) {
      if (res.at(-1) !== pad_char) res.push(pad_char);
    } else {
      res.push(c);
    }
    idx -= 1;
  }
  return res.reverse().join("");
}

function encode(chars) {
  return pack(chars.split("").map(encode_char));
}

function encode_char(char) {
  const res = dict_chars[char];
  return res ? res + idx_offset : idx_unknown;
}

function pack(ids) {
  ids = ids.slice(-max_len);
  return [].concat(
    Array(input_len - ids.length).fill(idx_unknown),
    ids,
  );
}

export function decode_char(index) {
  return index < idx_offset ? "，" : dict_idxs[index - idx_offset];
}

export async function predict(model, pattern) {
  const input = encode(pattern);
  return await run(model, input);
}

export async function predict_ime(model, pattern, code) {
  const input = pack([
    ...pattern.split("").map(encode_char),
    idx_ime_s,
    ...code.split("").map(encode_char),
    idx_ime_e,
  ]);
  const result = [];
  const preds = [];
  for (let i = 0; i < code.length; i++) {
    const pres = await run(model, input);
    preds.push(pres);
    const cres = pres[0][1];
    if (cres === idx_fill_e) break;
    input.push(cres);
    input.shift();
    result.push(decode_char(cres));
  }
  return [result.join(""), preds];
}

async function run(model, input) {
  const { output } = await model.run({
    input: new ort.Tensor("int64", input, [1, input_len]),
  });
  const prediction = softmax(output.data).slice(idx_valid);
  const pairs = Array.from(prediction).map((p, i) => [p, i + idx_valid]);
  const res = pairs.sort((a, b) => b[0] - a[0]);
  return res;
}

export async function get_model(name) {
  return await ort.InferenceSession.create(
    `/models/${name}/model.onnx`,
    {
      executionProviders: ["webgpu", "wasm"],
    },
  );
}
