import { createGraph } from '@ysk8hori/typescript-graph/dist/src/graph/createGraph';
import { Graph, Meta } from '@ysk8hori/typescript-graph/dist/src/models';
import { execSync } from 'child_process';
import { log } from './utils/log';
import { getTsconfigRoot } from './utils/config';
import path from 'path';
import github from './github';

/**
 * TypeScript Graph の createGraph を使い head と base の Graph を生成する
 *
 * 内部的に git fetch と git checkout を実行するので、テストで実行する際には execSync を mock すること。
 *
 * また、処理に時間がかかるため Promise を返す。
 */
export default async function getFullGraph() {
  const { repoDir } = await github.cloneRepo();
  // head の Graph を生成するために head に checkout する
  execSync(`git fetch origin ${github.getHeadSha()}`, { cwd: repoDir });
  execSync(`git checkout ${github.getHeadSha()}`, { cwd: repoDir });
  // head の Graph を生成
  const { graph: fullHeadGraph, meta } = createGraph(
    path.resolve(repoDir, getTsconfigRoot()),
  );
  log('fullHeadGraph.nodes.length:', fullHeadGraph.nodes.length);
  log('fullHeadGraph.relations.length:', fullHeadGraph.relations.length);
  // base の Graph を生成するために base に checkout する
  execSync(`git fetch origin ${github.getBaseSha()}`, { cwd: repoDir });
  execSync(`git checkout ${github.getBaseSha()}`, { cwd: repoDir });
  // base の Graph を生成
  const { graph: fullBaseGraph } = createGraph(
    path.resolve(repoDir, getTsconfigRoot()),
  );
  log('fullBaseGraph.nodes.length:', fullBaseGraph.nodes.length);
  log('fullBaseGraph.relations.length:', fullBaseGraph.relations.length);
  return { fullHeadGraph, fullBaseGraph, meta };
}