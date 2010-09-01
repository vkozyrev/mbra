var dmz =
      { object: require("dmz/components/object")
      , objectType: require("dmz/runtime/objectType")
      , defs: require("dmz/runtime/definitions")
      , data: require("dmz/runtime/data")
      , mask: require("dmz/types/mask")
      , message: require("dmz/runtime/messaging")
      , util: require("dmz/types/util")
      , time: require("dmz/runtime/time")
      }
   , ObjectiveBarValueHandle = dmz.defs.createNamedHandle("NA_Objective_Bar_Value")
   , ObjectiveBarLabel = dmz.defs.createNamedHandle("NA_Objective_Bar_Label")
   , NodeType = dmz.objectType.lookup("na_node")
   , NodeLinkType = dmz.objectType.lookup("na_link_attribute")
   , SimType = dmz.objectType.lookup("na_simulator")
   , LabelHandle = dmz.defs.createNamedHandle("NA_Node_Objective_Label")
   , LinkHandle = dmz.defs.createNamedHandle("Node_Link")
   , LinkFlowHandle = dmz.defs.createNamedHandle("NA_Link_Flow")
   , ThreatHandle = dmz.defs.createNamedHandle("NA_Node_Threat")
   , ThreatCalculatedHandle = dmz.defs.createNamedHandle("NA_Node_Threat_Calculated")
   , VulnerabilityHandle = dmz.defs.createNamedHandle("NA_Node_Vulnerability")
   , VulnerabilityReducedHandle = dmz.defs.createNamedHandle(
        "NA_Node_Vulnerability_Reduced")
   , PreventionCostHandle = dmz.defs.createNamedHandle("NA_Node_Prevention_Cost")
   , PreventionAllocationHandle = dmz.defs.createNamedHandle(
        "NA_Node_Prevention_Allocation")
   , ResponseAllocationHandle = dmz.defs.createNamedHandle(
        "NA_Node_Response_Allocation")
   , AttackAllocationHandle = dmz.defs.createNamedHandle(
        "NA_Node_Attack_Allocation")
   , ConsequenceHandle = dmz.defs.createNamedHandle("NA_Node_Consequence")
   , ConsequenceReducedHandle = dmz.defs.createNamedHandle(
        "NA_Node_Consequence_Reduced")
   , RiskInitialHandle = dmz.defs.createNamedHandle("NA_Node_Risk_Initial")
   , RiskReducedHandle = dmz.defs.createNamedHandle("NA_Node_Risk_Reduced")
   , WeightHandle = dmz.defs.createNamedHandle("NA_Node_Weight")
   , WeightAndObjectiveHandle = dmz.defs.createNamedHandle(
        "NA_Node_Weight_And_Objective")
   , GammaHandle = dmz.defs.createNamedHandle("NA_Node_Gamma")
   , RankHandle = dmz.defs.createNamedHandle("NA_Node_Rank")
   , DegreeHandle = dmz.defs.createNamedHandle("NA_Node_Degrees")
   , BetweennessHandle = dmz.defs.createNamedHandle("NA_Node_Betweenness")
   , HeightHandle = dmz.defs.createNamedHandle("NA_Node_Height")
   , ContagiousHandle = dmz.defs.createNamedHandle("NA_Node_Contagiousness")
   , ResponseHandle = dmz.defs.createNamedHandle("NA_Node_Response_Cost")
   , AttackHandle = dmz.defs.createNamedHandle("NA_Node_Attack_Cost")
   , OverlayState = dmz.defs.lookupState("NA_Node_Overlay")
   , ForwardState = dmz.defs.lookupState("NA_Flow_Forward")
   , ReverseState = dmz.defs.lookupState("NA_Flow_Reverse")
   , FlowStateMask = ForwardState.or(ReverseState)

   , WeightDegreesHandle = dmz.defs.createNamedHandle("NA_Weight_Degrees")
   , WeightBetweennessHandle = dmz.defs.createNamedHandle("NA_Weight_Betweenness")
   , WeightHeightHandle = dmz.defs.createNamedHandle("NA_Weight_Height")
   , WeightContagiousHandle = dmz.defs.createNamedHandle("NA_Weight_Contagiousness")

   , ObjectiveNoneHandle = dmz.defs.createNamedHandle("NA_Objective_None")
   , ObjectiveRiskHandle = dmz.defs.createNamedHandle("NA_Objective_Risk")
   , ObjectiveTxVHandle = dmz.defs.createNamedHandle("NA_Objective_TxV")
   , ObjectiveThreatHandle = dmz.defs.createNamedHandle("NA_Objective_Threat")
   , ObjectiveVulnerabilityHandle = dmz.defs.createNamedHandle(
        "NA_Objective_Vulnerability")
   , ObjectiveConsequenceHandle = dmz.defs.createNamedHandle("NA_Objective_Consequence")

   , UnfixedPreventionHandle = dmz.defs.createNamedHandle("NA_Objective_Var_Prevention")
   , UnfixedResponseHandle = dmz.defs.createNamedHandle("NA_Objective_Var_Response")
   , UnfixedAttackHandle = dmz.defs.createNamedHandle("NA_Objective_Var_Attack")
   , simulatorMessage = dmz.message.create(
        self.config.string("simulator-message.name", "NASimulatorMessage"))
   , preventionBudgetMessage = dmz.message.create(
        self.config.string(
           "message.prevention-budget.name",
           "PreventionBudgetMessage"))
   , responseBudgetMessage = dmz.message.create(
        self.config.string("message.response-budget.name", "ResponseBudgetMessage"))
   , cinfinityMessage = dmz.message.create(
        self.config.string("c-infinity-message.name", "NAConsequenceInfinityMessage"))
   , vinfinityMessage = dmz.message.create(
        self.config.string("v-infinity-message.name", "NAVulnerabilityInfinityMessage"))
   , updateObjectiveGraphMessage = dmz.message.create(
        self.config.string(
           "update-objective-graph-message.name",
           "NA_Objective_Graph_Visible_Message"))
   , updateSumsMessage = dmz.message.create(
        self.config.string(
           "message.sums.name",
           "NA_Objective_Sums_Message"))
   , updateFixedMessage = dmz.message.create(
        self.config.string(
           "message.objective-budgets.name",
           "NA_Objective_Fixed_Budgets_Message"))
   , doRankCount = 0
   , doRank = function () {
        doRankCount = 2;
     }
   , doGraphCount = 0
   , doGraph = function () {
        doGraphCount = 2;
     }
   , objects = {}
   , calcObjectiveNone = function (object) {
        dmz.object.text(object, LabelHandle, "");
        return [0, 0];
     }
   , objective = calcObjectiveNone
   , weightList = []
   , preventionBudget = 0
   , activePreventionBudget = 0
   , maxPreventionBudget = 0
   , responseBudget = 0
   , activeResponseBudget = 0
   , maxResponseBudget = 0
   , attackBudget = 0
   , activeAttackBudget = 0
   , maxAttackBudget = 0
   , maxDegrees = 0
   , maxHeight = 0
   , maxBetweenness = 0
   , maxContagious = 0
   , vinf = 0.05
   , cinf = 0.05
   , barCount = 10
   , bars = []
   , visible = false
   , reducedSum = 0
   , origSum = 0
   , updateGraph = false
   , rankLimit = self.config.number("rank.limit", 9)
   , EmptyMask = dmz.mask.create()
   , logLambdaVulnerability
   , logLambdaConsequence
   , logLambdaThreat
   , UnfixedVariable = UnfixedPreventionHandle
   , doCalculations = false

   , updateObjectiveGraph
   , weighObject
   , calcRiskReduced
   , receiveRank
   , workFunc
   , timeSlice
   , notZero = dmz.util.isNotZero
   , calcRiskInitial
   , calcVulnerability
   , calcConsequence
   , calcThreat
   , calcPreventionAllocation
   , calcAttackAllocation
   , calcResponseAllocation
   , formatResult
   , calcObjectiveRisk
   , calcObjectiveTxV
   , calcObjectiveThreat
   , calcObjectiveVulnerability
   , calcObjectiveConsequence
   , weightDegrees
   , linkReachable
   , allLinksFlow
   , isSink
   , addToNodeBetweennessCounter
   , addToLinkBetweennessCounter
   , findBetweenness
   , weightBetweenness
   , updateHeight
   , findHeight
   , weightHeight
   , weightContagious
   , weighObject
   , preventionLogTerm
   , responseLogTerm
   , attackLogTerm
   , rankObject
   , receiveRank
   , receiveHide
   , updateSimulatorFlag
   , updateObjectScalar
   , updateFixedObjectiveFlag
   , stackleberg
   , calculateLambdas
   ;

(function () {
   var ix;
   for (ix = 0; ix <= barCount; ix += 1) {
      bars[ix] = dmz.object.create("na_objective_bar");
      dmz.object.counter(bars[ix], "NA_Objective_Bar_Number", ix);
      dmz.object.counter(bars[ix], "NA_Objective_Bar_Value", 0);
      dmz.object.activate(bars[ix]);
   }
}());

workFunc = function () {
   if (doGraphCount > 1) {
      doGraphCount -= 1;
   }
   else if (doGraphCount === 1) {
      updateObjectiveGraph();
      doGraphCount = 0;
   }
   if (doRankCount > 1) {
      doRankCount -= 1;
   }
   else if (doRankCount === 1) {
      receiveRank();
      doRankCount = 0;
   }
};

timeSlice = dmz.time.setRepeatingTimer(self, workFunc);

calcRiskInitial = function (object) {
   var Threat = dmz.object.scalar(object, ThreatHandle)
     , Vulnerability = dmz.object.scalar(object, VulnerabilityHandle)
     , Consequence = dmz.object.scalar(object, ConsequenceHandle)
     ;
   if (Threat && Vulnerability && Consequence) {
      dmz.object.scalar(
         object,
         RiskInitialHandle,
         Threat * Vulnerability * Consequence);
   }
   else {
      dmz.object.scalar(object, RiskInitialHandle, 0);
   }
};

calcVulnerability = function (object) {
   var result = 0
     , Allocation = dmz.object.scalar(object, PreventionAllocationHandle)
     , Vulnerability = dmz.object.scalar(object, VulnerabilityHandle)
     , Cost = dmz.object.scalar(object, PreventionCostHandle)
     , Gamma = dmz.object.scalar(object, GammaHandle)
     , Budget = activePreventionBudget
     ;

   if (Vulnerability) { result = Vulnerability; }

   if (Gamma && notZero(Gamma) && Vulnerability && (Vulnerability > 0) &&
         Cost && (Cost > 0) && notZero(Cost) && Allocation && notZero(Allocation) &&
         notZero(Budget)) {
      result = Vulnerability * Math.exp(-Gamma * Allocation / Cost);
   }

   if (result < vinf) { result = vinf; }

   dmz.object.scalar(object, VulnerabilityReducedHandle, result);
   return result;
};

calcConsequence = function (object) {
   var result = 0
     , Allocation = dmz.object.scalar(object, ResponseAllocationHandle)
     , Consequence = dmz.object.scalar(object, ConsequenceHandle)
     , Cost = dmz.object.scalar(object, ResponseHandle)
     , Budget = activeResponseBudget
     ;

   if (Consequence) { result = Consequence; }

   if (Consequence && (Consequence > 0) && Cost && (Cost > 0) && notZero(Cost) &&
         Allocation && notZero(Allocation) && notZero(Budget)) {
      result = Consequence * Math.exp((Math.log(cinf)) * Allocation / Cost);
   }

   if (result < cinf) { result = cinf; }

   dmz.object.scalar(object, ConsequenceReducedHandle, result);
   return result;

};

calcThreat = function (object) {
   var result = 1
     , Allocation = dmz.object.scalar(object, AttackAllocationHandle)
     , Cost = dmz.object.scalar(object, PreventionCostHandle)
     , Gamma = dmz.object.scalar(object, GammaHandle)
     , Budget = activeAttackBudget
     ;

   if (Gamma && notZero(Gamma) && Cost && (Cost > 0) && notZero(Cost) &&
         Allocation && notZero(Allocation) && notZero(Budget)) {
      result -= Math.exp(-Gamma * Allocation / Cost);
   }
   else {
      result = dmz.object.scalar(object, ThreatHandle);
   }

   dmz.object.scalar(object, ThreatCalculatedHandle, result);
   return result;
};

calcPreventionAllocation = function (object) {
   var result = 0
     , Cost = object.preventionCost
     , Vulnerability = object.vul
     , Consequence = object.reducedC
     , Threat = object.reducedT
     , Weight = object.weight
     , Gamma = object.gamma
     , AttackMod = object.attackMod // Changes when FT has XOR, used for v3.0
     ;

   if (Gamma && notZero(Gamma) && Weight && notZero(Weight) && Cost && notZero(Cost) &&
         notZero(Consequence) && notZero(Threat) && notZero(Vulnerability)) {
      result = - Cost / Gamma * (logLambdaVulnerability + Math.log(
         Cost / (Weight * Threat * Vulnerability * Consequence * AttackMod * Gamma)));
   }

   if (result < 0) {
      result = 0;
      object.allocP = false;
   }

   dmz.object.scalar(object.handle, PreventionAllocationHandle, result);
   return result;
};

calcAttackAllocation = function (object) {
   var result = 0
     , Cost = object.preventionCost
     , Vulnerability = object.reducedV
     , Consequence = object.reducedC
     , Weight = object.weight
     , AttackMod = object.attackMod // Changes when FT has XOR, used for v3.0
     , Gamma = object.gamma
     ;

   if (Gamma && notZero(Gamma) && Weight && notZero(Weight) && Cost && notZero(Cost)) {
      result = - Cost / Gamma * (logLambdaThreat +
         Math.log(Cost / (Weight * Vulnerability * Consequence * AttackMod * Gamma)));
   }

   if (result < 0) {
      result = 0;
      object.allocA = false;
   }

   dmz.object.scalar(object.handle, AttackAllocationHandle, result);
   return result;
};

calcResponseAllocation = function (object) {
   var result = 0
     , Cost = object.responseCost
     , Beta = object.beta
     , Weight = object.weight
     , Threat = object.reducedT
     , Vulnerability = object.reducedV
     , Consequence = object.consequence
     ;

   if (Weight && notZero(Weight) && Cost && notZero(Cost) &&
         notZero(Consequence) && notZero(Threat) && notZero(Vulnerability)) {

      result = -Cost / Beta * (logLambdaConsequence +
         Math.log(Cost / (Weight * Threat * Vulnerability * Consequence * Beta)));
   }

   if (result < 0) {
      result = 0;
      object.allocR = false;
   }

   dmz.object.scalar(object.handle, ResponseAllocationHandle, result);
   return result;
};

calcRiskReduced = function (object) {
   var result = 0
     , Threat = dmz.object.scalar(object, ThreatCalculatedHandle)
     , Vulnerability = dmz.object.scalar(object, VulnerabilityReducedHandle)
     , Consequence = dmz.object.scalar(object, ConsequenceReducedHandle)
     ;

   if (Threat && Vulnerability && Consequence) {
      result = Threat * Vulnerability * Consequence;
   }

   dmz.object.scalar(object, RiskReducedHandle, result);
   return result;
};

formatResult = function (value) {
   return (value * 100).toFixed() + "%";
};

calcObjectiveRisk = function (object) {
   var result = dmz.object.scalar(object, RiskReducedHandle)
     , orig = dmz.object.scalar(object, RiskInitialHandle)
     ;
   if (!result) {
      result = 0;
   }
   if (visible) {
      dmz.object.text(object, LabelHandle, "Risk = " + result.toFixed(2));
   }
   return [result, orig];
};

calcObjectiveTxV = function (object) {
   var result = 0
     , orig = 0
     , Threat = dmz.object.scalar(object, ThreatHandle)
     , ThreatCalculated = dmz.object.scalar(object, ThreatCalculatedHandle)
     , VulnerabilityReduced = dmz.object.scalar(object, VulnerabilityReducedHandle)
     , Vulnerability = dmz.object.scalar(object, VulnerabilityHandle)
     ;

   if (ThreatCalculated && VulnerabilityReduced) {
      result = ThreatCalculated * VulnerabilityReduced;
   }
   if (Threat && Vulnerability) {
      orig = Threat * Vulnerability;
   }
   if (visible) {
      dmz.object.text(object, LabelHandle, "T x V = " + formatResult(result));
   }
   return [result, orig];
};

calcObjectiveThreat = function (object) {
   var result = dmz.object.scalar(object, ThreatCalculatedHandle)
     , orig = dmz.object.scalar(object, ThreatHandle)
     ;
   if (!result) {
      result = 0;
   }
   if (visible) {
      dmz.object.text(object, LabelHandle, "Threat = " + formatResult(result));
   }
   return [result, orig];
};

calcObjectiveVulnerability = function (object) {
   var result = dmz.object.scalar(object, VulnerabilityReducedHandle)
     , orig = dmz.object.scalar(object, VulnerabilityHandle)
     ;
   if (!result) {
      result = 0;
   }
   if (visible) {
      dmz.object.text(object, LabelHandle,
                       "Vulnerability = " + formatResult(result));
   }
   return [result, orig];
};

calcObjectiveConsequence = function (object) {
   var result = dmz.object.scalar(object, ConsequenceReducedHandle)
     , orig = dmz.object.scalar(object, ConsequenceHandle)
     , str
     ;
   if (!result) {
      result = 0;
   }
   if (visible) {
      str = "Consequence = $" + result.toFixed(2);
      dmz.object.text(object, LabelHandle, str);
   }
   return [result, orig];
};

weightDegrees = {

   setup: function () {

      maxDegrees = 0;
      Object.keys(objects).forEach(function (key) {
         var value = dmz.object.scalar(objects[key], DegreeHandle);
         if (value && (value > maxDegrees)) {
            maxDegrees = value;
         }
      });
   },
   
   calc: function (object) {
      var result = 0
        , value = dmz.object.scalar(object, DegreeHandle)
        ;
      if (value && (maxDegrees > 0)) {
         result = value / maxDegrees;
      }
      return result;
   }

};

linkReachable = function (link, flowState) {
   var result = true
     , obj = dmz.object.linkAttributeObject(link)
     , state
     ;
   if (obj) {
      state = dmz.object.state(obj, LinkFlowHandle);
      if (state && (!state.and(FlowStateMask).equal(EmptyMask))) {
         if (!state.contains(flowState)) {
            result = false;
         }
      }
   }
   return result;
};

allLinksFlow = function (superList, subList, flowState) {
   var result = true
     , subBool = true
     , link
     , obj
     , state
     ;
   if (superList && subList) {
      Object.keys(superList).forEach(function (superkey) {
         if (!result) {
            return;
         }
         Object.keys(subList).forEach(function (subkey) {
            if (!subList[subkey]) {
               return;
            }
            link = dmz.object.linkHandle(LinkHandle, superList[superkey],
                                                    subList[subkey]);
            obj = null;
            if (link) {
               obj = dmz.object.linkAttributeObject(link);
            }
            else {
               self.log.error("No link found");
            }
            if (obj) {
               state = dmz.object.state(obj, LinkFlowHandle);
               if (state.bool()) {
                  if (!state.and(FlowStateMask).equal(flowState)) {
                     result = false;
                     subBool = false;
                  }
               }
               else {
                  result = false;
                  subBool = false;
               }
            }
            else {
               result = false;
               subBool = false;
            }
         });
      });
   }
   return result;
};

isSink = function (object) {
   var sinkObjList = []
     , result = false
     , sub = dmz.object.subLinks(object, LinkHandle)
     , superLink = dmz.object.superLinks(object, LinkHandle)
     ;
   sinkObjList[0] = object;
   if (sub || superLink) {
      if (allLinksFlow(sinkObjList, sub, ReverseState) &&
          allLinksFlow(superLink, sinkObjList, ForwardState)) {
         result = true;
      }
   }
   return result;
};

addToNodeBetweennessCounter = function (object) {
   var value = dmz.object.addToCounter(object, BetweennessHandle);
   if (value > maxBetweenness) {
      maxBetweenness = value;
   }
};

addToLinkBetweennessCounter = function (link) {
   var linkObj = dmz.object.linkAttributeObject(link)
     , value
     ;
   if (linkObj) {
      value = dmz.object.addToCounter(linkObj, BetweennessHandle);
      if (value > maxBetweenness) {
         maxBetweenness = value;
      }
   }
};

findBetweenness = function (current, target, visited) {
   var found = false
     , list = []
     , item
     , subs
     , link
     , supers
     , place
     ;
   Object.keys(current).forEach(function (key) {
      visited[current[key].object] = true;
   });
   Object.keys(current).forEach(function (key) {
      item = current[key];
      subs = dmz.object.subLinks(item.object, LinkHandle);
      if (subs) {
         Object.keys(subs).forEach(function (sub) {
            link = dmz.object.linkHandle(LinkHandle, item.object, subs[sub]);
            if (linkReachable(link, ForwardState)) {
               if (subs[sub] === target) {
                  found = true;
                  item.found = true;
                  addToNodeBetweennessCounter(target);
                  addToLinkBetweennessCounter(link);
               }
               else if (!visited[subs[sub]]) {
                  list.push({ object: subs[sub], link: link, parent: item });
               }
            }
         });
      }
      supers = dmz.object.superLinks(item.object, LinkHandle);
      if (supers) {
         Object.keys(supers).forEach(function (superLink) {
            link = dmz.object.linkHandle(LinkHandle, supers[superLink], item.object);
            if (linkReachable(link, ReverseState)) {
               if (supers[superLink] === target) {
                  found = true;
                  item.found = true;
                  addToNodeBetweennessCounter(target);
                  addToLinkBetweennessCounter(link);
               }
               else if (!visited[supers[superLink]]) {
                  list.push({ object: supers[superLink], link: link, parent: item});
               }
            }
         });
      }
   });
   if (!found && list.length > 0) {
      findBetweenness(list, target, visited);
      for (place = list.length - 1; place >= 0; place -= 1) {
         item = list[place];
         if (item.found) {
            addToNodeBetweennessCounter(item.object);
            addToLinkBetweennessCounter(item.link);
            item.parent.found = true;
         }
      }
   }
};

weightBetweenness = {

   setup: function () {
      var root
        , target
        , list
        , visited
        ;
      maxBetweenness = 0;
      Object.keys(objects).forEach(function (key) {
         dmz.object.counter(objects[key], BetweennessHandle, 0);
      });
      Object.keys(objects).forEach(function (key) {
         root = objects[key];
         if (dmz.object.type(root).isOfType(NodeType)) {
            Object.keys(objects).forEach(function (index) {
               target = objects[index];
               if (root !== target && dmz.object.type(target).isOfType(NodeType)) {
                  list = [{object: root}];
                  visited = [];
                  findBetweenness(list, target, visited);
                  if (list[0]) {
                     addToNodeBetweennessCounter(root);
                  }
               }
            });
         }
      });
   },

   calc: function (object) {
      var result = 0
        , value = dmz.object.counter(object, BetweennessHandle)
        ;
      if (value && (maxBetweenness > 0)) {
         result = value / maxBetweenness;
      }
      return result;
   }

};

updateHeight = function (obj, level, visited) {
   var result = false
     , value
     ;
   if (dmz.object.isLink(obj)) {
      obj = dmz.object.linkAttributeObject(obj);
   }
   if (obj && !visited[obj]) {
      result = true;
      visited[obj] = true;
      value = dmz.object.counter(obj, HeightHandle);
      if (!value) {
         value = 0;
      }
      if (level > value) {
         dmz.object.counter(obj, HeightHandle, level);
      }
   }
   return result;
};

findHeight = function (sink) {
   var queue = []
     , visited = []
     , node
     , height
     , subList
     , superList
     , link
     ;
   queue.push(sink);
   updateHeight(sink, 1, visited);
   while (queue.length > 0)  {
      node = queue.shift();
      height = dmz.object.counter(node, HeightHandle);
      if (!height) {
         self.log.error("No height found for.", node);
         height = 0;
      }
      subList = dmz.object.subLinks(node, LinkHandle);
      if (subList) {
         Object.keys(subList).forEach(function (key) {
            link = dmz.object.linkHandle(LinkHandle, node, subList[key]);
            if (link) {
               if (linkReachable(link, ReverseState)) {
                  updateHeight(link, height + 1, visited);
                  if (updateHeight(subList[key], height + 2, visited)) {
                     queue.push(subList[key]);
                  }
               }
            }
         });
      }
      superList = dmz.object.superLinks(node, LinkHandle);
      if (superList) {
         Object.keys(superList).forEach(function (key) {
            link = dmz.object.linkHandle(LinkHandle, superList[key], node);
            if (link) {
               if (linkReachable(link, ForwardState)) {
                  updateHeight(link, height + 1, visited);
                  if (updateHeight(superList[key], height + 2, visited)) {
                     queue.push(superList[key]);
                  }
               }
            }
         });
      }
   }
};

weightHeight = {

   setup: function () {
      var sinkFound
        , height
        ;
      maxHeight = 0;
      Object.keys(objects).forEach(function (key) {
         dmz.object.counter(objects[key], HeightHandle, 0);
      });

      sinkFound = false;
      Object.keys(objects).forEach(function (key) {
         if (isSink(objects[key])) {
            sinkFound = true;
            findHeight(objects[key]);
         }
      });
      if (sinkFound) {
         Object.keys(objects).forEach(function (key) {
            height = dmz.object.counter(objects[key], HeightHandle);
            if (height && (height > maxHeight)) {
               maxHeight = height;
            }
         });
      }
      else {
         maxHeight = 1;
         Object.keys(objects).forEach(function (key) {
            dmz.object.counter(objects[key], HeightHandle, 0);
         });
      }
   },

   calc: function (object) {
      var result = 0
        , value = dmz.object.counter(object, HeightHandle)
        ;
      if (value && (maxHeight > 0)) {
         result = value / maxHeight;
      }
      return result;
   }
};

weightContagious = {

   setup: function () {
      maxContagious = 0;
      Object.keys(objects).forEach(function (key) {
         var degree = dmz.object.scalar(objects[key], DegreeHandle)
           , threat = dmz.object.scalar(objects[key], ThreatHandle)
           , vuln = dmz.object.scalar(objects[key], VulnerabilityHandle)
           , value = degree * threat * vuln;
         if (degree > 0 && threat > 0 && vuln > 0) {
            if (value && (value > maxContagious)) {
               maxContagious = value;
            }
            dmz.object.scalar(objects[key], ContagiousHandle, value);
         }
         else {
            dmz.object.scalar(objects[key], ContagiousHandle, 0);
         }
      });
   },

   calc: function (object) {
      var result = 0
        , value = dmz.object.scalar(objects[object], ContagiousHandle)
        ;

      if (value > 0 && (maxContagious > 0)) {
         result = value / maxContagious;
      }
      return result;
   }
};

weighObject = function (object) {
   var value = 1;
   Object.keys(weightList).forEach(function (key) {
      value *= weightList[key].calc(object);
   });
   dmz.object.scalar(object, WeightHandle, value);
};

preventionLogTerm = function (object) {
   var result = object.weight * object.reducedT * object.vul * object.reducedC *
      object.gamma;

   if (notZero(result)) {
      result = object.preventionCost / result;
      if (object.gamma && (object.gamma > 0) && notZero(result)) {
         result = object.preventionCost / object.gamma * Math.log(result);
      }
   }
   return result;
};

responseLogTerm = function (object) {
   var result = object.weight * object.reducedT * object.reducedV * object.consequence *
      object.beta;

   if (notZero(result)) {
      result = object.responseCost / result;
      if (notZero(result)) {
         result = object.responseCost / object.beta * Math.log(result);
      }
   }
   return result;
};

attackLogTerm = function (object) {
   var result = object.weight * object.reducedV * object.reducedC * object.gamma;

   if (notZero(result)) {
      result = object.attackCost / result;
      if (notZero(object.gamma) && notZero(result)) {
         result = (object.attackCost / object.gamma) * Math.log(result);
      }
   }

   return result;
};

calculateLambdas = function (objectList) {
   var A = [0, 0, 0]
     , B = [0, 0, 0]
     ;

   objectList.forEach(function (object) {
      if (object.allocP) { A[0] += preventionLogTerm(object); }
      if (object.allocR) { A[1] += responseLogTerm(object); }
      if (object.allocA) { A[2] += attackLogTerm(object); }
      if (notZero(object.gamma)) {
         if (object.allocP) { B[0] += (object.preventionCost / object.gamma); }
         if (object.allocA) { B[2] += (object.attackCost / object.gamma); }
      }
      if (notZero(object.beta)) {
         if (object.allocR) { B[1] += (object.responseCost / object.beta); }
      }
   });

   logLambdaVulnerability = notZero(B[0]) ?
      ((-activePreventionBudget - A[0]) / B[0]) :
      0;
   logLambdaConsequence = notZero(B[1]) ? ((-activeResponseBudget - A[1]) / B[1]) : 0;
   logLambdaThreat = notZero(B[2]) ? ((-activeAttackBudget - A[2]) / B[2]) : 0;

};

stackleberg = function () {
   var objectList
     , object
     , iterationCount = 40
     , Threshold = 0.001
     , currV
     , currT
     , currC
     , A
     , B
     ;

   objectList = [];
   Object.keys(objects).forEach(function (key) {
      object = { handle: objects[key] };
      object.vul = dmz.object.scalar(objects[key], VulnerabilityHandle);
      if (!object.vul || (object.vul <= 0)) {
         object.vul = 1;
      }
      if (object.vul < vinf) {
         object.vul = vinf;
      }

      object.gamma = -Math.log(vinf / object.vul);
      if (object.gamma < 0) {
         object.gamma = 0;
      }
      object.beta = -Math.log(cinf);
      if (object.beta < 0) {
         object.beta = 0;
      }

      dmz.object.scalar(objects[key], GammaHandle, object.gamma);

      object.preventionCost = dmz.object.scalar(objects[key], PreventionCostHandle);
      if (!object.preventionCost) {
         object.preventionCost = 0;
      }

      object.responseCost = dmz.object.scalar(objects[key], ResponseHandle);
      if (!object.responseCost) {
         object.responseCost = 0;
      }

      object.attackCost = object.preventionCost;
      if (!object.attackCost) {
         object.attackCost = 0;
      }

      object.weight = dmz.object.scalar(objects[key], WeightHandle);
      if (!object.weight) {
         object.weight = 0;
      }
      object.threat = dmz.object.scalar(objects[key], ThreatHandle);
      if (!object.threat) {
         object.threat = 0;
      }
      object.consequence = dmz.object.scalar(objects[key], ConsequenceHandle);
      if (!object.consequence) {
         object.consequence = 0;
      }

      object.reducedV = object.vul;
      object.reducedT = object.threat;
      object.reducedC = object.consequence;
      object.attackMod = 1; //Will have to add iteration if threat is XOR, see notes
      object.preventionAllocation = 0;
      object.responseAllocation = 0;
      object.attackAllocation = 0;
      object.updateV = true;
      object.updateT = true;
      object.updateC = true;
      object.allocP = true;
      object.allocR = true;
      object.allocA = true;
      objectList.push(object);
   });

   while (iterationCount > 0) {

      calculateLambdas(objectList);

      objectList.forEach(function (object) {
         currV = currT = currC = -1;

         if (object.updateV && object.allocP) {
            calcPreventionAllocation(object);
            currV = calcVulnerability(object.handle);
            if (Math.abs((currV - object.reducedV) / object.reducedV) <= Threshold) {
               object.updateV = false;
            }
         }

         if (object.updateT && object.allocA) {
            calcAttackAllocation(object);
            currT = calcThreat(object.handle);
            if (Math.abs((currT - object.reducedT) / object.reducedT) <= Threshold) {
               object.updateT = false;
            }
         }

         if (object.updateC && object.allocR) {
            calcResponseAllocation(object);
            currC = calcConsequence(object.handle);
            if (Math.abs((currC - object.reducedC) / object.reducedC) <= Threshold) {
               object.updateC = false;
            }
         }

         if (currV !== -1) { object.reducedV = currV; }
         if (currT !== -1) { object.reducedT = currT; }
         if (currC !== -1) { object.reducedC = currC; }
      });

      iterationCount -= 1;
   }

};

rankObject = function (object) {
   var result = dmz.object.scalar(object, WeightHandle)
     , objectiveArray
     , reduced
     , Orig
     ;
   if (!result) {
      result = 1;
   }
   if (objective) {
      objectiveArray = objective(object);
      reduced = objectiveArray[0];
      Orig = objectiveArray[1];
      reducedSum += reduced;
      origSum += Orig;
      result *= reduced;
   }
   dmz.object.scalar(object, WeightAndObjectiveHandle, result);
   return result;
};

receiveRank = function () {
   var list = []
     , state
     , object
     , data
     , count
     , lastRank
     ;
   visible = true;
   Object.keys(weightList).forEach(function (key) {
      weightList[key].setup();
   });
   Object.keys(objects).forEach(function (key) {
      weighObject(objects[key]);
   });

   stackleberg();

   reducedSum = 0;
   origSum = 0;
   Object.keys(objects).forEach(function (key) {

      if (dmz.object.isObject(objects[key])) {
         state = dmz.object.state(objects[key]);
         if (state) {
            state = state.unset(OverlayState);
            dmz.object.state(objects[key], null, state);
         }
         if (dmz.object.text(objects[key], RankHandle)) {
            dmz.object.text.remove(objects[key], RankHandle);
         }
         calcRiskReduced(objects[key]);
         object = { handle: objects[key] };
         object.rank = rankObject(object.handle);
         list.push(object);
      }
   });
   data = dmz.data.create();
   data.number("Float64", 0, reducedSum);
   data.number("Float64", 1, origSum);
   updateSumsMessage.send(data);
   list.sort(function (obj1, obj2) {
      return obj2.rank - obj1.rank;
   });
   count = 1;
   lastRank = null;
   Object.keys(list).forEach(function (index) {
      object = list[index];
      if (!lastRank) {
         lastRank = object.rank;
      }
      else if (lastRank > object.rank) {
         count += 1;
         lastRank = object.rank;
      }
      dmz.object.text(object.handle, RankHandle, count);
      if (rankLimit && count <= rankLimit && object.rank > 0) {
         state = dmz.object.state(object.handle);
         if (!state) {
            state = dmz.mask.create();
         }
         state = state.or(OverlayState);
         dmz.object.state(object.handle, null, state);
      }
   });
};

receiveHide = function () {
   var handle
     , state
     ;
   visible = false;
   Object.keys(objects).forEach(function (key) {
      handle = objects[key];
      if (dmz.object.isObject(handle)) {
         dmz.object.text(handle, LabelHandle, "");
         state = dmz.object.state(handle);
         if (state) {
            state = state.unset(OverlayState);
            dmz.object.state(handle, null, state);
         }
         if (dmz.object.text(handle, RankHandle)) {
            dmz.object.text.remove(handle, RankHandle);
         }
      }
   });
};

updateObjectiveGraph = function () {
   var max = 0
     , budgets = []
     , list = []
     , ix
     , result
     , budget = []
     , array
     , startTime = dmz.time.getSystemTime()
     ;
   if (updateGraph) {

      activeAttackBudget = attackBudget;
      activePreventionBudget = preventionBudget;
      activeResponseBudget = responseBudget;

      for (ix = 0; ix <= barCount; ix += 1) {
         if (UnfixedVariable === UnfixedPreventionHandle) {
            activePreventionBudget = maxPreventionBudget * (ix / barCount);
            budgets[ix] = activePreventionBudget;
         }
         else if (UnfixedVariable === UnfixedResponseHandle) {
            activeResponseBudget = maxResponseBudget * (ix / barCount);
            budgets[ix] = activeResponseBudget;
         }
         else if (UnfixedVariable === UnfixedAttackHandle) {
            activeAttackBudget = maxAttackBudget * (ix / barCount);
            budgets[ix] = activeAttackBudget;
         }

         Object.keys(weightList).forEach(function (key) {
            weightList[key].setup();
         });
         Object.keys(objects).forEach(function (object) {
            weighObject(objects[object]);
         });

         stackleberg();
         result = 0;
         if (objective) {
            Object.keys(objects).forEach(function (key) {
               calcRiskReduced(objects[key]);
               array = objective(objects[key]);
               result += array[0];
            });
         }
         if (result > max) {
            max = result;
         }
         list[ix] = result;
      }
      self.log.warn(list);
      if (max > 0) {
         for (ix = 0; ix <= barCount; ix += 1) {
            list[ix] = Math.ceil(list[ix] / max * 100);
         }
      }
      else {
         for (ix = 0; ix <= barCount; ix += 1) {
            list[ix] = 0;
         }
      }
      self.log.warn(list);
      for (ix = 0; ix <= barCount; ix += 1) {
         dmz.object.counter(bars[ix], ObjectiveBarValueHandle, list[ix]);
         dmz.object.text(bars[ix], ObjectiveBarLabel, "$" + Math.floor(budgets[ix]));
      }

      activeAttackBudget = attackBudget;
      activePreventionBudget = preventionBudget;
      activeResponseBudget = responseBudget;
      stackleberg();

      self.log.error("Update Graph:", (dmz.time.getSystemTime() - startTime));
   }
};

// function receive_simulator
simulatorMessage.subscribe(self, function (data) {
   if (dmz.data.isTypeOf(data)) {
      if (data.boolean("Boolean", 0)) {
         doCalculations = true;
         doRank();
         doGraph();
      }
      else {
         doCalculations = false;
         receiveHide();
      }
   }
});

// function receive_prevention_budget
preventionBudgetMessage.subscribe(self, function (data, message) {
   if (dmz.data.isTypeOf(data)) {
      preventionBudget = data.number("Budget", 0);
      if (!preventionBudget) { preventionBudget = 0; }
      activePreventionBudget = preventionBudget;
      maxPreventionBudget = data.number("Budget", 1);
      if (!maxPreventionBudget) {
         maxPreventionBudget = 0;
      }
      attackBudget = preventionBudget;
      activeAttackBudget = preventionBudget;
      maxAttackBudget = maxPreventionBudget;
      if (visible && doCalculations) {
         doRank();
         doGraph();
      }
   }
});

// function receive_response_budget
responseBudgetMessage.subscribe(self, function (data) {
   if (dmz.data.isTypeOf(data)) {
      responseBudget = data.number("Budget", 0);
      if (!responseBudget) { responseBudget = 0; }
      activeResponseBudget = responseBudget;
      maxResponseBudget = data.number("Budget", 1);
      if (!maxResponseBudget) { maxResponseBudget = 0; }
      if (visible && doCalculations) {
         doRank();
         doGraph();
      }
   }
});

// function receive_vinfinity
vinfinityMessage.subscribe(self, function (data) {
   if (dmz.data.isTypeOf(data)) {
      vinf = data.number("value", 0);
      if (!vinf) {
         vinf = 0.05;
      }
      if (visible && doCalculations) {
         doRank();
      }
   }
});

cinfinityMessage.subscribe(self, function (data) {
   if (dmz.data.isTypeOf(data)) {
      cinf = data.number("value", 0);
      if (!cinf) { cinf = 0.05; }
      if (visible && doCalculations) { doRank(); }
   }
});

updateObjectiveGraphMessage.subscribe(self, function (data) {
   if (dmz.data.isTypeOf(data)) {
      updateGraph = data.boolean("Boolean", 0);
      updateObjectiveGraph();
   }
});

dmz.object.create.observe(self, function (handle, objType, varity) {
   if (objType) {
      if (objType.isOfType(NodeType) || objType.isOfType(NodeLinkType)) {
         objects[handle] = handle;
         if (doCalculations) {
            if (visible && objects[handle]) {
               doRank();
            }
            doGraph();
         }
      }
   }
});

updateObjectScalar = function (handle) {
   if (doCalculations) {
      if (visible && objects[handle]) {

         doRank();
      }
      calcRiskInitial(handle);
      doGraph();
   }
};

dmz.object.scalar.observe(self, ThreatHandle, updateObjectScalar);
dmz.object.scalar.observe(self, VulnerabilityHandle, updateObjectScalar);
dmz.object.scalar.observe(self, PreventionCostHandle, updateObjectScalar);
dmz.object.scalar.observe(self, ConsequenceHandle, updateObjectScalar);
dmz.object.scalar.observe(self, DegreeHandle, updateObjectScalar);

updateSimulatorFlag = function (handle, attr, value) {
   if (value) {
      if (attr === WeightDegreesHandle) {
         weightList[WeightDegreesHandle] = weightDegrees;
      }
      else if (attr === WeightBetweennessHandle) {
         weightList[WeightBetweennessHandle] = weightBetweenness;
      }
      else if (attr === WeightHeightHandle) {
         weightList[WeightHeightHandle] = weightHeight;
      }
      else if (attr === WeightContagiousHandle) {
         weightList[WeightContagiousHandle] = weightContagious;
      }
      else if (attr === ObjectiveNoneHandle) {
         objective = calcObjectiveNone;
      }
      else if (attr === ObjectiveRiskHandle) {
         objective = calcObjectiveRisk;
      }
      else if (attr === ObjectiveTxVHandle) {
         objective = calcObjectiveTxV;
      }
      else if (attr === ObjectiveThreatHandle) {
         objective = calcObjectiveThreat;
      }
      else if (attr === ObjectiveVulnerabilityHandle) {
         objective = calcObjectiveVulnerability;
      }
      else if (attr === ObjectiveConsequenceHandle) {
         objective = calcObjectiveConsequence;
      }
      doGraph();
   }
   else if (weightList[attr]) {
      delete weightList[attr];
      doGraph();
   }
   if (visible && doCalculations) {
      doRank();
   }
};

dmz.object.flag.observe(self, WeightDegreesHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, WeightBetweennessHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, WeightHeightHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, WeightContagiousHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, ObjectiveNoneHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, ObjectiveRiskHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, ObjectiveTxVHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, ObjectiveThreatHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, ObjectiveVulnerabilityHandle, updateSimulatorFlag);
dmz.object.flag.observe(self, ObjectiveConsequenceHandle, updateSimulatorFlag);

updateFixedObjectiveFlag = function (handle, attr, value) {
   if (value) {
      UnfixedVariable = attr;
      if (doCalculations) { doGraph(); }
   }
};

dmz.object.flag.observe(self, UnfixedAttackHandle, updateFixedObjectiveFlag);
dmz.object.flag.observe(self, UnfixedPreventionHandle, updateFixedObjectiveFlag);
dmz.object.flag.observe(self, UnfixedResponseHandle, updateFixedObjectiveFlag);


dmz.object.destroy.observe(self, function (handle) {
   var updateRank = false;
   if (visible && objects[handle]) {
      updateRank = true;
   }
   delete objects[handle];
   if (updateRank && doCal) {
      doRank();
   }
   doGraph();
});

dmz.object.link.observe(self, LinkHandle, function (link, attr, Super, sub) {
   if (doCalculations) {
      if (visible && objects[Super]) {
         doRank();
      }
      doGraph();
   }
});

dmz.object.unlink.observe(self, LinkHandle, function (link, attr, Super, sub) {
   if (doCalculations) {
      if (visible && objects[Super]) {
         doRank();
      }
      doGraph();
   }
});

dmz.object.linkAttributeObject.observe(self, LinkHandle,
function (link, attr, Super, sub, object) {
   if (doCalculations) {
      if (visible && object && objects[object]) {
         doRank();
      }
      doGraph();
   }
});

dmz.object.state.observe(self, LinkFlowHandle, function (object) {
   if (doCalculations) {
      if (visible && object && objects[object]) {
         doRank();
      }
      doGraph();
   }
});
