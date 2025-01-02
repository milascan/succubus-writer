import * as ort from "./ort.min.js";
import {
  dict_chars,
  dict_idxs,
  idx_cls,
  idx_offset,
  idx_pad,
  idx_sep,
  idx_unknown,
  input_len,
  max_len,
} from "./model-config.json" with { type: "json" };

ort.env.wasm.wasmPaths = "/onnx/";
ort.env.wasm.numThreads = 1;

function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const scores = logits.map((l) => Math.exp(l - maxLogit));
  const denom = scores.reduce((a, b) => a + b);
  return scores.map((s) => s / denom);
}

function encode(chars) {
  const t_chars = chars.slice(-max_len);
  const ids = t_chars.map((c) =>
    (dict_chars[c] ?? idx_unknown - idx_offset) + idx_offset
  );
  return [
    [idx_cls].concat(
      ids,
      [idx_sep],
      Array(input_len - 2 - t_chars.length).fill(idx_pad),
    ),
    Array(t_chars.length + 2).fill(1).concat(
      Array(input_len - 2 - t_chars.length).fill(0),
    ),
  ];
}

export function decode_char(index) {
  return index < idx_offset ? "" : dict_idxs[index - idx_offset];
}

export async function predict(model, pattern) {
  const [input, mask] = encode(pattern.slice(-max_len).split(""));
  const { output } = await model.run({
    input: new ort.Tensor("int64", input, [1, 9]),
    mask: new ort.Tensor("int64", mask, [1, 9]),
  });
  const prediction = softmax(output.data);
  const pairs = Array.from(prediction).map((p, i) => [p, i]);
  const res = pairs.sort((a, b) => b[0] - a[0]);
  return res;
}

export async function get_model(name) {
  return await ort.InferenceSession.create(
    `/models/onnx-model.${name}.onnx`,
    {
      executionProviders: ["wasm"],
    },
  );
}
