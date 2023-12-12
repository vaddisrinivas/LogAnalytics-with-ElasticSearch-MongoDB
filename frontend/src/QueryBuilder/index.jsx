/*eslint no-unused-vars: ["off", {"varsIgnorePattern": "^_"}]*/
import React, {useState, useEffect} from "react";
import {
  Utils, Query, Builder
} from "@react-awesome-query-builder/mui";
import loadedConfig from "./config";
const stringify = JSON.stringify;
const {jsonLogicFormat, queryString, elasticSearchFormat, getTree, checkTree, loadTree, uuid} = Utils;
const preStyle = { backgroundColor: "darkgrey", margin: "10px", padding: "10px" };
  
const emptyInitValue = {"id": uuid(), "type": "group"};

const initValue = emptyInitValue;
const initTree = checkTree(loadTree(initValue), loadedConfig);

export default function QueryBuilder({setQuery}) {
  const [tree, setTree] = useState(initTree);
  const [config, setConfig] = useState(loadedConfig);

  useEffect(() => {
    updateResult();
  }, [tree, config]);

  const resetValue = () => {
    setTree(initTree);
  };

  const clearValue = () => {
    setTree(loadTree(emptyInitValue));
  };

  const renderBuilder = (props) => (
    <div className="query-builder-container" style={{padding: "10px"}}>
      <div className="query-builder">
        <Builder {...props} />
      </div>
    </div>
  );
    
  const onChange = (immutableTree, config) => {
    setTree(immutableTree);
    setConfig(config);

    // `jsonTree` or `logic` can be saved to backend
    // (and then loaded with `loadTree` or `loadFromJsonLogic` as seen above)
    const jsonTree = getTree(immutableTree);
    const {logic, data, errors} = jsonLogicFormat(immutableTree, config);
    setQuery(elasticSearchFormat(immutableTree, config));
  };

  const updateResult = () => {
    setTree(tree);
    setConfig(config);
  };

  const renderResult = ({tree: immutableTree, config}) => {
    const {logic, data, errors} = jsonLogicFormat(immutableTree, config);
    return (
      <div>
        <br />
        <div>
          stringFormat: 
          <pre style={preStyle}>
            {stringify(queryString(immutableTree, config), undefined, 2)}
          </pre>
        </div>
        <hr/>
        <div>
          humanStringFormat: 
          <pre style={preStyle}>
            {stringify(queryString(immutableTree, config, true), undefined, 2)}
          </pre>
        </div>
        <hr/>
        <div>
          elasticSearchFormat: 
          <pre style={preStyle}>
            {stringify(elasticSearchFormat(immutableTree, config), undefined, 2)}
          </pre>
        </div>
        <hr/>
      </div>
    );
  };

  return (
    <div>
      <Query 
        {...loadedConfig} 
        value={tree}
        onChange={onChange}
        renderBuilder={renderBuilder}
      />

      <button onClick={resetValue}>reset</button>
      <button onClick={clearValue}>clear</button>

      <div className="query-builder-result">
        {renderResult({tree, config})}
      </div>
    </div>
  );
}
