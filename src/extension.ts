import { ensureSyntaxTree, tokenClassNodeProp } from '@codemirror/language';
import {
  EditorState,
  RangeSetBuilder,
  StateEffect,
  StateField,
} from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { setIcon } from 'obsidian';

import { CalloutConfig } from './settings';

export const setConfig = StateEffect.define<CalloutConfig>();

export class CalloutBackground extends WidgetType {
  toDOM() {
    return createSpan({
      cls: 'lc-list-bg',
      attr: {
        'aria-hidden': 'true',
      },
    });
  }
  eq(): boolean {
    return true;
  }
}

export class CalloutMarker extends WidgetType {
  char: string;
  icon?: string;

  constructor(char: string, icon?: string) {
    super();

    this.char = char;
    this.icon = icon;
  }

  toDOM() {
    return createSpan(
      {
        text: this.char,
        cls: 'lc-list-marker',
        attr: {
          'aria-hidden': 'true',
        },
      },
      (s) => {
        if (this.icon) {
          setIcon(s, this.icon);
        }
      }
    );
  }

  eq(widget: CalloutMarker): boolean {
    return widget.char === this.char && widget.icon === this.icon;
  }
}

export const calloutDecoration = (char: string, color: string) =>
  Decoration.line({
    attributes: {
      class: 'lc-list-callout',
      style: `--lc-callout-color: ${color}`,
      'data-callout': char,
    },
  });

export const calloutsConfigField = StateField.define<CalloutConfig>({
  create() {
    return { callouts: {}, re: null };
  },
  update(state, tr) {
    for (const e of tr.effects) {
      if (e.is(setConfig)) {
        state = e.value;
      }
    }

    return state;
  },
});

export function buildCalloutDecos(view: EditorView, state: EditorState) {
  const config = state.field(calloutsConfigField);
  if (!config?.re || !view.visibleRanges.length) return Decoration.none;

  const builder = new RangeSetBuilder<Decoration>();
  const lastRange = view.visibleRanges[view.visibleRanges.length - 1];
  const tree = ensureSyntaxTree(state, lastRange.to, 50);
  const { doc } = state;

  let lastEnd = -1;

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter({ type, from, to }): false | void {
        if (from <= lastEnd) return;

        const prop = type.prop(tokenClassNodeProp);
        if (prop && /formatting-list/.test(prop)) {
          const { from: lineFrom, to, text } = doc.lineAt(from);
          const match = text.match(config.re);
          const callout = match ? config.callouts[match[2]] : null;

          lastEnd = to;

          if (callout) {
            const labelPos = lineFrom + match[1].length;

            // Set the line class and callout color
            builder.add(
              lineFrom,
              lineFrom,
              calloutDecoration(callout.char, callout.color)
            );

            // Add the callout background element
            builder.add(
              lineFrom,
              lineFrom,
              Decoration.widget({ widget: new CalloutBackground(), side: -1 })
            );

            // Decorate the callout marker
            builder.add(
              labelPos,
              labelPos + callout.char.length,
              Decoration.replace({
                widget: new CalloutMarker(callout.char, callout.icon),
              })
            );
          }
        }
      },
    });
  }

  return builder.finish();
}

export const calloutExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildCalloutDecos(view, view.state);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.transactions.some((tr) =>
          tr.effects.some((e) => e.is(setConfig))
        )
      ) {
        this.decorations = buildCalloutDecos(update.view, update.state);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
