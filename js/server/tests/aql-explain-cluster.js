/*jshint globalstrict:false, strict:false, maxlen: 500 */
/*global fail, assertEqual, assertTrue, assertFalse, AQL_EXPLAIN */
////////////////////////////////////////////////////////////////////////////////
/// @brief tests for optimizer rules
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2010-2012 triagens GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is triAGENS GmbH, Cologne, Germany
///
/// @author Jan Steemann
/// @author Copyright 2012, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

var jsunity = require("jsunity");
var errors = require("internal").errors;
var db = require("org/arangodb").db;

////////////////////////////////////////////////////////////////////////////////
/// @brief test suite
////////////////////////////////////////////////////////////////////////////////

function explainSuite () {
  var cn = "UnitTestsAhuacatlExplain";
  var c;

  return {

////////////////////////////////////////////////////////////////////////////////
/// @brief set up
////////////////////////////////////////////////////////////////////////////////

    setUp : function () {
      db._drop(cn);
      c = db._create(cn);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief tear down
////////////////////////////////////////////////////////////////////////////////

    tearDown : function () {
      db._drop(cn);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test bind parameters
////////////////////////////////////////////////////////////////////////////////

    testExplainBindMissing : function () {
      var actual;
      var query = "RETURN @foo";
      
      try {
        actual = AQL_EXPLAIN(query);
        fail();
      }
      catch (err) {
        assertEqual(err.errorNum, errors.ERROR_QUERY_BIND_PARAMETER_MISSING.code);
      }
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test bind parameters
////////////////////////////////////////////////////////////////////////////////

    testExplainBindPresent : function () {
      var actual;
      var query = "RETURN @foo";
      
      actual = AQL_EXPLAIN(query, { foo: "bar" });
      assertEqual(3, actual.plan.nodes.length);
      assertEqual("SingletonNode", actual.plan.nodes[0].type);
      assertEqual("CalculationNode", actual.plan.nodes[1].type);
      assertEqual("ReturnNode", actual.plan.nodes[2].type);
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test verbosity w/ single plan
////////////////////////////////////////////////////////////////////////////////

    testExplainVerbosity : function () {
      var actual;
      var query = "FOR i IN " + cn + " FOR j IN " + cn + " RETURN i";
      
      // single plan, no options
      actual = AQL_EXPLAIN(query);
      assertTrue(actual.hasOwnProperty("plan"));
      assertFalse(Array.isArray(actual.plan));
      assertTrue(actual.plan.hasOwnProperty("nodes"));
      assertTrue(Array.isArray(actual.plan.nodes));
      assertTrue(actual.plan.hasOwnProperty("rules"));
      assertTrue(Array.isArray(actual.plan.rules));
      assertTrue(actual.plan.hasOwnProperty("estimatedCost"));
      
      actual.plan.nodes.forEach(function(node) {
        assertTrue(node.hasOwnProperty("type"));
        assertFalse(node.hasOwnProperty("typeID")); // deactivated if not verbose
        assertTrue(node.hasOwnProperty("dependencies"));
        assertTrue(Array.isArray(node.dependencies));
        assertFalse(node.hasOwnProperty("parents")); // deactivated if not verbose
        assertTrue(node.hasOwnProperty("id"));
        assertTrue(node.hasOwnProperty("estimatedCost"));
      });

      // single plan, verbose options
      actual = AQL_EXPLAIN(query, { }, { verbosePlans: true });
      assertTrue(actual.hasOwnProperty("plan"));
      assertFalse(Array.isArray(actual.plan));
      assertTrue(actual.plan.hasOwnProperty("nodes"));
      assertTrue(Array.isArray(actual.plan.nodes));
      assertTrue(actual.plan.hasOwnProperty("rules"));
      assertTrue(Array.isArray(actual.plan.rules));

      actual.plan.nodes.forEach(function(node) {
        assertTrue(node.hasOwnProperty("type"));
        assertTrue(node.hasOwnProperty("typeID"));
        assertTrue(node.hasOwnProperty("dependencies"));
        assertTrue(Array.isArray(node.dependencies));
        assertTrue(node.hasOwnProperty("parents"));
        assertTrue(Array.isArray(node.parents));
        assertTrue(node.hasOwnProperty("id"));
        assertTrue(node.hasOwnProperty("estimatedCost"));
      });
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test explain w/ a signle plan vs. all plans
////////////////////////////////////////////////////////////////////////////////

    testExplainAllPlansVsSingle : function () {
      var actual;
      var query = "FOR i IN " + cn + " FOR j IN " + cn + " RETURN i";
      
      // single plan
      actual = AQL_EXPLAIN(query, { }, { verbosePlans: true });
      assertTrue(actual.hasOwnProperty("plan"));
      assertFalse(actual.hasOwnProperty("plans"));
      assertFalse(Array.isArray(actual.plan));

      assertTrue(actual.plan.hasOwnProperty("nodes"));
      assertTrue(Array.isArray(actual.plan.nodes));

      actual.plan.nodes.forEach(function(node) {
        assertTrue(node.hasOwnProperty("type"));
        assertTrue(node.hasOwnProperty("typeID")); 
        assertTrue(node.hasOwnProperty("dependencies"));
        assertTrue(Array.isArray(node.dependencies));
        assertTrue(node.hasOwnProperty("parents"));
        assertTrue(node.hasOwnProperty("id"));
        assertTrue(node.hasOwnProperty("estimatedCost"));
      });
      
      assertTrue(actual.plan.hasOwnProperty("rules"));
      assertTrue(Array.isArray(actual.plan.rules));
      

      // multiple plans
      actual = AQL_EXPLAIN(query, { }, { allPlans: true, verbosePlans: true });
      assertFalse(actual.hasOwnProperty("plan"));
      assertTrue(actual.hasOwnProperty("plans"));
      assertTrue(Array.isArray(actual.plans));

      actual.plans.forEach(function (plan) {
        assertTrue(plan.hasOwnProperty("nodes"));
        assertTrue(Array.isArray(plan.nodes));
      
        plan.nodes.forEach(function(node) {
          assertTrue(node.hasOwnProperty("type"));
          assertTrue(node.hasOwnProperty("typeID")); 
          assertTrue(node.hasOwnProperty("dependencies"));
          assertTrue(Array.isArray(node.dependencies));
          assertTrue(node.hasOwnProperty("parents"));
          assertTrue(node.hasOwnProperty("id"));
          assertTrue(node.hasOwnProperty("estimatedCost"));
        });

        assertTrue(plan.hasOwnProperty("rules"));
        assertTrue(Array.isArray(plan.rules));
      });
    },

////////////////////////////////////////////////////////////////////////////////
/// @brief test nodes in plan
////////////////////////////////////////////////////////////////////////////////

    testNodes : function () {
      var actual;
      var query = "FOR i IN " + cn + " FILTER i.value > 1 LET a = i.value / 2 SORT a DESC COLLECT x = a INTO g RETURN x";
      
      actual = AQL_EXPLAIN(query, null, { optimizer: { rules: [ "-all" ] } });
      var nodes = actual.plan.nodes, node;

      var n = 0;
      node = nodes[n++];
      assertEqual("SingletonNode", node.type);
      assertEqual([ ], node.dependencies);
      assertEqual(1, node.id);
      assertEqual(1, node.estimatedCost);
      var prev = node.id;
      
      node = nodes[n++];
      assertEqual("ScatterNode", node.type);
      assertEqual([ prev ], node.dependencies);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("RemoteNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertTrue(node.estimatedCost >= 1.0);
      prev = node.id;
     
      node = nodes[n++];
      assertEqual("EnumerateCollectionNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertEqual("_system", node.database);
      assertEqual(cn, node.collection);
      assertEqual("i", node.outVariable.name);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("RemoteNode", node.type);
      assertEqual([ prev ], node.dependencies);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("GatherNode", node.type);
      assertEqual([ prev ], node.dependencies);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("CalculationNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertTrue(node.hasOwnProperty("expression"));
      assertFalse(node.canThrow);
      var out = node.outVariable.name;
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("FilterNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertEqual(out, node.inVariable.name);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("CalculationNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertTrue(node.hasOwnProperty("expression"));
      assertEqual("a", node.outVariable.name);
      assertFalse(node.canThrow);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("SortNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertEqual(1, node.elements.length);
      assertEqual("a", node.elements[0].inVariable.name);
      assertFalse(node.stable);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("SortNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertEqual(1, node.elements.length);
      assertEqual("a", node.elements[0].inVariable.name);
      assertTrue(node.stable);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("AggregateNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertEqual(1, node.aggregates.length);
      assertEqual("a", node.aggregates[0].inVariable.name);
      assertEqual("x", node.aggregates[0].outVariable.name);
      assertEqual("g", node.outVariable.name);
      prev = node.id;
      
      node = nodes[n++];
      assertEqual("ReturnNode", node.type);
      assertEqual([ prev ], node.dependencies);
      assertEqual("x", node.inVariable.name);
    }

  };
}

////////////////////////////////////////////////////////////////////////////////
/// @brief executes the test suite
////////////////////////////////////////////////////////////////////////////////

jsunity.run(explainSuite);

return jsunity.done();

// Local Variables:
// mode: outline-minor
// outline-regexp: "^\\(/// @brief\\|/// @addtogroup\\|// --SECTION--\\|/// @page\\|/// @}\\)"
// End:
