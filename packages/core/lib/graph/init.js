import { standardVertices } from "./data/standard/vertex";
import { crateriaEdges } from "./data/standard/edges/crateria";
import { greenbrinstarEdges } from "./data/standard/edges/greenbrinstar";
import { redbrinstarEdges } from "./data/standard/edges/redbrinstar";
import { kraidslairEdges } from "./data/standard/edges/kraid";
import { crocomireEdges } from "./data/standard/edges/crocomire";
import { westmaridiaEdges } from "./data/standard/edges/westmaridia";
import { eastmaridiaEdges } from "./data/standard/edges/eastmaridia";
import { uppernorfairEdges } from "./data/standard/edges/uppernorfair";
import { lowernorfairEdges } from "./data/standard/edges/lowernorfair";
import { wreckedshipEdges } from "./data/standard/edges/wreckedship";
import { bossEdges } from "./data/standard/edges/boss";
import { BossMode, MapLayout, MajorDistributionMode } from "./params";
import { RecallVertexUpdates } from "./data/recall/vertex";
import { RecallEdgeUpdates } from "./data/recall/edges";
import { StandardAreaEdgeUpdates } from "./data/standard/area";
import { mapPortals } from "./data/portals";
import { bossItem, Item } from "../items";
import DotNetRandom from "../dotnet-random";
import { ChozoVertexUpdates } from "./data/chozo/vertex";

const getStandardEdges = () => {
  return {
    Crateria: crateriaEdges,
    GreenBrinstar: greenbrinstarEdges,
    RedBrinstar: redbrinstarEdges,
    KraidsLair: kraidslairEdges,
    Crocomire: crocomireEdges,
    WestMaridia: westmaridiaEdges,
    EastMaridia: eastmaridiaEdges,
    UpperNorfair: uppernorfairEdges,
    LowerNorfair: lowernorfairEdges,
    WreckedShip: wreckedshipEdges,
    Bosses: bossEdges,
  };
};

const getAllVertices = () => {
  return Object.entries(standardVertices)
    .map(([k, v]) => {
      return Object.entries(v).map(([name, type]) => {
        return {
          name: name,
          type: type,
          area: k,
          item: undefined,
          pathToStart: false,
        };
      });
    })
    .reduce((acc, cur) => {
      return acc.concat(cur);
    }, []);
};

const allEdges = Object.entries(getStandardEdges())
  .map(([_, v]) => {
    return Object.entries(v)
      .map(([from, w]) => {
        return Object.entries(w).map(([to, condition]) => {
          return {
            from: from,
            to: to,
            condition: condition,
          };
        });
      })
      .reduce((acc, cur) => {
        return acc.concat(cur);
      }, []);
  })
  .reduce((acc, cur) => {
    return acc.concat(cur);
  }, []);

//-----------------------------------------------------------------
// Build a graph representing the game world.
//-----------------------------------------------------------------

const createGraph = (
  portalMapping,
  vertexUpdates,
  edgeUpdates,
  startVertex
) => {
  //-----------------------------------------------------------------
  // Get all vertices for the graph. Vertices represent locations
  // within the game world.
  //-----------------------------------------------------------------

  const allVertices = getAllVertices();

  const findVertex = (name) => {
    const vertex = allVertices.find((v) => v.name == name);
    if (vertex == undefined) {
      throw new Error(`createGraph: could not find vertex, ${name}`);
    }
    return vertex;
  };

  //-----------------------------------------------------------------
  // Apply specified vertex updates. Currently restricted to type
  // but may include other options eventually.
  //-----------------------------------------------------------------

  vertexUpdates.forEach((v) => {
    findVertex(v.name).type = v.type;
  });

  //-----------------------------------------------------------------
  // Set a flag on the start vertex. This flag exists on all
  // vertices and is used for caching to speed up solving.
  //-----------------------------------------------------------------

  if (startVertex != undefined) {
    findVertex(startVertex).pathToStart = true;
  } else {
    findVertex("Ship").pathToStart = true;
  }

  //-----------------------------------------------------------------
  // Get all edges for the graph. Edges establish the condition to
  // travel from one vertex to another.
  //-----------------------------------------------------------------

  const edges = allEdges
    .map((e) => {
      return {
        from: findVertex(e.from),
        to: findVertex(e.to),
        condition: e.condition,
      };
    })
    .concat(
      portalMapping.map((a) => {
        return {
          from: findVertex(a[0]),
          to: findVertex(a[1]),
          condition: true,
        };
      })
    )
    .concat(
      portalMapping.map((a) => {
        return {
          from: findVertex(a[1]),
          to: findVertex(a[0]),
          condition: true,
        };
      })
    );

  //-----------------------------------------------------------------
  // Apply specified edge updates. This could simply be a logic
  // change or could include edits to the map.
  //-----------------------------------------------------------------

  edgeUpdates.forEach((c) => {
    const [from, to] = c.edges;
    const edge = edges.find((n) => n.from.name == from && n.to.name == to);
    if (edge == null) {
      throw new Error(`Could not find edge from ${from} to ${to}`);
    }
    edge.condition = c.requires;
  });

  //-----------------------------------------------------------------
  // Return all valid edges. Some edges are placeholders and may
  // not be available for the current graph. There is no reason
  // to include those as it will slow down solving.
  //-----------------------------------------------------------------

  return edges.filter(e => e.condition !== false);
};

//-----------------------------------------------------------------
// Creates a copy of the graph. New memory is allocated for the
// vertices and edges so that changes can be made to the cloned
// graph without changing the original.
//-----------------------------------------------------------------

export const cloneGraph = (graph) => {
  const newVertices = getAllVertices();

  const remap = (orig) => {
    let v = newVertices.find((v) => v.name == orig.name);
    v.type = orig.type;
    v.area = orig.area;
    v.pathToStart = orig.pathToStart;
    if (orig.item != undefined) {
      v.item = {...orig.item};
    }
    return v;
  }

  return graph.map((e) => {
    return {
      from: remap(e.from),
      to: remap(e.to),
      condition: e.condition,
    };
  });
};

//-----------------------------------------------------------------
// Gets an array of edge updates based on the settings.
//-----------------------------------------------------------------

const getEdgeUpdates = (mapLayout, areaShuffle) => {
  switch (mapLayout) {
    case MapLayout.Standard:
    case MapLayout.Classic:
      if (areaShuffle) {
        return StandardAreaEdgeUpdates;
      }
      return [];
    case MapLayout.Recall:
      if (areaShuffle) {
        return RecallEdgeUpdates.concat(StandardAreaEdgeUpdates);
      }
      return RecallEdgeUpdates;
    default:
      throw new Error(`Unknown map layout: ${mapLayout}`);
  }
};

//-----------------------------------------------------------------
// Gets an array of vertex updates based on the settings.
//-----------------------------------------------------------------

const getVertexUpdates = (mode) => {
  switch(mode) {
    case MajorDistributionMode.Recall:
      return RecallVertexUpdates;
    case MajorDistributionMode.Chozo:
      return ChozoVertexUpdates;
    default:
      return [];
  }
}

//-----------------------------------------------------------------
// Adds pseudo items to a graph for defeating bosses based on the
// settings provided. Updates the areas of boss nodes and related
// nodes like the exit and prize nodes.
//-----------------------------------------------------------------

const addBossItems = (graph, mode) => {
  const isUnique = (value, index, array) => {
    return array.indexOf(value) === index;
  };
  const bosses = graph
    .filter((e) => e.from.type == "boss")
    .map((e) => e.from)
    .filter(isUnique);

  const getAdjacent = (boss) => {
    const exit = graph.find(
      (e) => e.from.type == "exit" && e.to == boss
    ).from;
    const doorEdge = graph.find((e) => e.from != boss && e.to == exit);
    const itemEdge = graph.find((e) => e.from == boss && e.to.type == "major");

    return {
      exit,
      door: doorEdge.from,
      prize: itemEdge?.to
    }
  }

  if (mode == BossMode.Shuffled) {
    bosses.forEach((b) => {
      const { exit, door, prize } = getAdjacent(b);
      switch (b.area) {
        case "Kraid":
          b.item = bossItem(Item.DefeatedBrinstarBoss);
          prize.area = "KraidsLair";
          break;
        case "Phantoon":
          b.item = bossItem(Item.DefeatedWreckedShipBoss);
          break;
        case "Draygon":
          b.item = bossItem(Item.DefeatedMaridiaBoss);
          prize.area = "EastMaridia";
          break;
        case "Ridley":
          b.item = bossItem(Item.DefeatedNorfairBoss);
          prize.area = "LowerNorfair";
          break;
      }
      exit.area = door.area;
      b.area = door.area;
    });
  } else {
    bosses.forEach((b) => {
      const { exit, door, prize } = getAdjacent(b);

      if (prize != undefined) {
        prize.area = door.area;
      }

      exit.area = door.area;
      b.area = door.area;
      switch (b.area) {
        case "KraidsLair":
          b.item = bossItem(Item.DefeatedBrinstarBoss);
          break;
        case "WreckedShip":
          b.item = bossItem(Item.DefeatedWreckedShipBoss);
          break;
        case "EastMaridia":
          b.item = bossItem(Item.DefeatedMaridiaBoss);
          break;
        case "LowerNorfair":
          b.item = bossItem(Item.DefeatedNorfairBoss);
          break;
      }
    });
  }
};

//-----------------------------------------------------------------
// Loads a graph using the specified settings.
//-----------------------------------------------------------------

export const loadGraph = (
  seed,
  attempt,
  mapLayout,
  majorDistributionMode,
  areaShuffle = false,
  bossMode = BossMode.Vanilla,
  portals = undefined
) => {
  const getSeed = () => {
    if (attempt == 1) {
      return seed;
    }

    const seedGen = new DotNetRandom(-seed);
    for (let i = 0; i < attempt - 2; i++) {
      seedGen.InternalSample();
    }
    return seedGen.NextInRange(1, 1000000);
  };

  const getPortals = () =>
    portals ? portals : mapPortals(getSeed(), areaShuffle, bossMode);

  const g = createGraph(
    getPortals(),
    getVertexUpdates(majorDistributionMode),
    getEdgeUpdates(mapLayout, areaShuffle)
  );
  addBossItems(g, bossMode);
  return g;
};
