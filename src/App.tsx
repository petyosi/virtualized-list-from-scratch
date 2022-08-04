import React, { useCallback, useRef, useState } from "react";
import "./App.css";
import * as u from "@virtuoso.dev/urx";
import { systemToComponent } from "@virtuoso.dev/react-urx";

// this should be pulled from DOM, but hard to do in 30m.
const VIEWPORT_HEIGHT = 300;

// URX starts state-management first - you construct the system(s)...
// below is a system that declares a single stateful stream.
const listSystem = u.system(() => {
  const totalCount = u.statefulStream(0);
  const itemHeight = u.statefulStream(20);
  const scrollTop = u.statefulStream(0);

  // let's calculate the items based on the two inputs from above.
  // note: recalculating the items array each time itemHeight changes is sub-optimal
  // in this simplistic scenario, this is a bit of an overkill. but it illustrates the point of pipe and combine latest.
  const itemsStateEmitter = u.pipe(
    u.combineLatest(totalCount, itemHeight, scrollTop),
    u.map(([totalCount, itemHeight, scrollTop]) => {
      const firstItemIndex = Math.floor(scrollTop / itemHeight);
      const lastItemIndex = Math.ceil(
        (scrollTop + VIEWPORT_HEIGHT) / itemHeight
      );

      const itemCount = lastItemIndex - firstItemIndex;
      const totalHeight = totalCount * itemHeight;
      const itemsHeight = itemCount * itemHeight;
      const paddingTop = firstItemIndex * itemHeight;
      const paddingBottom = totalHeight - itemsHeight - paddingTop;

      const items = Array.from({ length: itemCount }, (_, index) => {
        return { label: `Item ${index + firstItemIndex}`, height: itemHeight };
      });

      return {
        paddingTop,
        paddingBottom,
        items,
      };
    })
  );

  // we are want items to be accessed with `useEmitterValue` - so we will wrap the emitter
  // to a stateful stream with default value.
  // technically, combining two stateful streams will result in a stateful emitter, but this is hard to be described in typescript :(.
  const itemsState = u.statefulStreamFromEmitter(itemsStateEmitter, {
    paddingTop: 0,
    paddingBottom: 0,
    items: [],
  });

  return {
    // inputs
    // these two will come from component props...
    totalCount,
    itemHeight,
    // from system POV, scrollTop is an input, just like the component props.
    // It does not matter that it gets reported from the user input.
    scrollTop,

    // output
    itemsState,
  };
});

function useScrollTop(callback: (value: number) => void) {
  const elRef = useRef<HTMLDivElement>();
  const onScrollCallback = useCallback(
    (e: Event) => {
      callback((e.target as HTMLDivElement)?.scrollTop);
    },
    [callback]
  );

  const callbackRef = (el: HTMLDivElement | null) => {
    if (el) {
      el.addEventListener("scroll", onScrollCallback);
      elRef.current = el;
    } else {
      elRef.current?.removeEventListener("scroll", onScrollCallback);
    }
  };

  return callbackRef;
}

// this will be our React component root.
const ListRoot = () => {
  const itemsState = useEmitterValue("itemsState");
  const scrollTopPublisher = usePublisher("scrollTop");
  const scrollTop = useEmitterValue("scrollTop");
  // this is just for example purposes.
  const ref = useScrollTop(scrollTopPublisher);
  return (
    <div>
      scrollTop: {scrollTop}
      <div
        ref={ref}
        style={{
          height: VIEWPORT_HEIGHT,
          width: 500,
          overflowY: "auto",
          border: "1px solid black",
        }}
      >
        <div
          style={{
            paddingTop: itemsState.paddingTop,
            paddingBottom: itemsState.paddingBottom,
          }}
        >
          {itemsState.items.map((item) => (
            <div style={{ height: item.height }}>{item.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// systemToComponent constructs the actual, public component from the system and the component root.
// the `useEmitterValue` is a hook used in the component root.
const {
  Component: List,
  useEmitterValue,
  usePublisher,
} = systemToComponent(
  listSystem,
  {
    required: {
      totalCount: "totalCount",
      itemHeight: "itemHeight",
    },
  },
  ListRoot
);

function App() {
  const [totalCount, setTotalCount] = useState(100);
  const [itemHeight, setItemHeight] = useState(20);
  return (
    <div className="App">
      <div>
        <label>
          total count:{" "}
          <input
            type="number"
            value={totalCount}
            onChange={(e) => setTotalCount(parseInt(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          item height:{" "}
          <input
            type="number"
            value={itemHeight}
            onChange={(e) => setItemHeight(parseInt(e.target.value))}
          />
        </label>
      </div>
      <List itemHeight={itemHeight} totalCount={totalCount} />
    </div>
  );
}

export default App;
