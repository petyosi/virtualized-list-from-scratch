import React, { useState } from "react";
import "./App.css";
import * as u from "@virtuoso.dev/urx";
import { systemToComponent } from "@virtuoso.dev/react-urx";

// URX starts state-management first - you construct the system(s)...
// below is a system that declares a single stateful stream.
const listSystem = u.system(() => {
  const totalCount = u.statefulStream(0);
  return { totalCount };
});

// this will be our React component root.
const ListRoot = () => {
  // access the value in the `totalCount` stream.
  // the component is re-rendered each time totalCount changes.
  const totalCount = useEmitterValue("totalCount");
  return <div>totalCount: {totalCount}</div>;
};

// systemToComponent constructs the actual, public component from the system and the component root.
// the `useEmitterValue` is a hook used in the component root.
const { Component: List, useEmitterValue } = systemToComponent(
  listSystem,
  {
    required: {
      totalCount: "totalCount",
    },
  },
  ListRoot
);

function App() {
  const [totalCount, setTotalCount] = useState(10);
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
      <List totalCount={totalCount} />
    </div>
  );
}

export default App;
