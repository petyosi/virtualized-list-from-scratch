import React, { useState } from "react";
import "./App.css";
import * as u from "@virtuoso.dev/urx";
import { systemToComponent } from "@virtuoso.dev/react-urx";

// URX starts state-management first - you construct the system(s)...
// below is a system that declares a single stateful stream.
const listSystem = u.system(() => {
  const totalCount = u.statefulStream(0);
  const itemHeight = u.statefulStream(20);

  // let's calculate the items based on the two inputs from above.
  // note: recalculating the items array each time itemHeight changes is sub-optimal
  // in this simplistic scenario, this is a bit of an overkill. but it illustrates the point of pipe and combine latest.
  const itemsEmitter = u.pipe(
    u.combineLatest(totalCount, itemHeight),
    u.map(([totalCount, itemHeight]) => {
      return Array.from({ length: totalCount }, (_, index) => {
        return { label: `Item ${index}`, height: itemHeight };
      });
    })
  );

  // we are want items to be accessed with `useEmitterValue` - so we will wrap the emitter
  // to a stateful stream with default value.
  // technically, combining two stateful streams will result in a stateful emitter, but this is hard to be described in typescript :(.
  const items = u.statefulStreamFromEmitter(itemsEmitter, []);

  return {
    // inputs
    totalCount,
    itemHeight,

    // output
    items,
  };
});

// this will be our React component root.
const ListRoot = () => {
  const items = useEmitterValue("items");
  return (
    <div>
      {items.map((item) => (
        <div style={{ height: item.height }}>{item.label}</div>
      ))}
    </div>
  );
};

// systemToComponent constructs the actual, public component from the system and the component root.
// the `useEmitterValue` is a hook used in the component root.
const { Component: List, useEmitterValue } = systemToComponent(
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
  const [totalCount, setTotalCount] = useState(10);
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
