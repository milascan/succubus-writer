// deno-lint-ignore-file no-explicit-any
import presetUno from "@unocss/preset-uno";
import presetIcons from "@unocss/preset-icons";
import { presetRadix } from "unocss-preset-radix";
import transformerVariantGroup from "@unocss/transformer-variant-group";
import transformerDirectives from "@unocss/transformer-directives";
import extractorSvelte from "@unocss/extractor-svelte";
import { defineConfig } from "unocss";

const pseudo = (variant: string, selector = variant) => (matcher: string) => {
  if (!matcher.startsWith(variant)) return matcher;
  return {
    matcher: matcher.slice(variant.length),
    selector: (s: string) => s + selector,
  };
};

const colors = {
  acc: "plum",
  base: "gray",
  err: "ruby",
  info: "cyan",
  prim: "blue",
  succ: "green",
  warn: "orange",
};

const all_colors = [
  "amber",
  "blue",
  "bronze",
  "brown",
  "crimson",
  "cyan",
  "gold",
  "grass",
  "gray",
  "green",
  "indigo",
  "lime",
  "mauve",
  "mint",
  "olive",
  "orange",
  "pink",
  "plum",
  "purple",
  "red",
  "sage",
  "sand",
  "sky",
  "slate",
  "teal",
  "tomato",
  "violet",
  "yellow",
  "jade",
  "iris",
  "ruby",
];

export default defineConfig({
  presets: [
    presetUno({
      dark: "media",
    }),
    presetRadix({
      palette: all_colors as any,
      aliases: colors as any,
    }),
    presetIcons({
      scale: 1.2,
      collections: {
        mdi: () =>
          import("@iconify-json/material-symbols/icons.json").then((
            i,
          ) => i.default),
      },
      extraProperties: {
        "display": "block",
        "vertical-align": "middle",
      },
    }),
  ],
  variants: [
    // toggled:
    pseudo("toggled:", '[toggled="true"]'),
  ],
  shortcuts: {
    "tint": "light:bg-hue-3A dark:bg-hue-2A",
    "stroke": "ring-(1 inset hue-6A)",
    "fill": `
            light:(bg-hue-10 text-hue-1) !light:*:text-hue-1
            dark:(bg-hue-5 text-hue-12) !dark:*:text-hue-12`,
    "rect": "rounded-none before:rounded-none after:rounded-none",
    "shadow-base":
      "border-(black/10 solid) shadow-[0_0_3px] shadow-black/10 dark:(border-black/25 shadow-black/20)",
    "shadow-base-x": "shadow-base border-x-1 first:border-l-0 last:border-r-0",
    "shadow-base-y": "shadow-base border-y-1 first:border-t-0 last:border-b-0",
    "shadow-solid":
      "border-(white/10 solid) shadow-[0_0_3px] shadow-black/10 dark:(border-white/25 shadow-black/20)",
    "button": `
            relative rounded-md
            toggled:fill
            disabled:(contrast-50 opacity-50)
            [&:not(:disabled)]:(
                before:(
                    content-['_'] absolute inset-0 rounded-md
                    transition-400 @hover:(transition-none bg-hue-3A ring-(1 inset hue-6A))
                )
                after:(
                    content-['_'] absolute inset-0 rounded-md
                    transition-400 ring-(2 inset transparent)
                    active:(transition-none ring-(2 inset hue-9))
                )
            )`,
    "button-base": "flex p-2",
    "button-detail": `
            flex items-center
            lt-md:(flex-col justify-evenly p-1 text-center)
            md:(justify-between p-2 gap-2 text-end)`,
    "button-active":
      "[&:not(:disabled)]:after:(transition-none ring-(2 hue-9))",
    "card": `
            rounded-lg before:rounded-lg after:rounded-lg bg-hue-2 shadow-sm
            light:shadow-hue-5A
            dark:ring-(1 inset hue-5A)`,
    "absolute-center": "absolute top-1/2 left-1/2 translate--1/2",
    "box": "flex flex-col",
    "box-row": "flex-1 flex min-h-0 [&_>_.box]:min-h-0",
    "box-fill": "box flex-1 min-h-0",
    "box-scroll": "box-fill overflow-y-auto",

    // action style
    "act-box": "box gap-2",
    "act-label": "text-(sm hue-11) h-4 lh-4",
    "act-field": "button tint h-10 lh-10 px-2 text-(start base hue-11)",
  },
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
  extractors: [
    extractorSvelte(),
  ],
  content: {
    pipeline: {
      include: [
        "src/**/*.{js,ts,svelte,html}",
      ],
    },
  },
  safelist: [
    "hue-base",
    "text-base",
    "text-hue-12",
    "text-nowrap",
    "select-none",
    ...Object.keys(colors).map((c) => `hue-${c}`),
    ...all_colors.map((c) => `hue-${c}`),
  ],
});
