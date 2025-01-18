import * as ort from "./ort.min.js";
import {
  dict_chars,
  dict_idxs,
  idx_offset,
  idx_unknown,
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
  const t_chars = chars.slice(-max_len);
  const ids = t_chars.map((c) =>
    (dict_chars[c] ?? idx_unknown - idx_offset) + idx_offset
  );
  return [].concat(
    Array(input_len - t_chars.length).fill(idx_unknown),
    ids,
  );
}

export function decode_char(index) {
  return index < idx_offset ? "，" : dict_idxs[index - idx_offset];
}

export async function predict(model, pattern) {
  const input = encode(pattern.slice(-max_len).split(""));
  const { output } = await model.run({
    input: new ort.Tensor("int64", input, [1, input_len]),
  });
  const prediction = softmax(output.data).slice(idx_offset);
  const pairs = Array.from(prediction).map((p, i) => [p, i + idx_offset]);
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
