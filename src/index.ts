import getFullGraph from './getFullGraph';
import { outputGraph, output2Graphs } from './graph';
import { log } from './utils/log';
import { readRuntimeConfig } from './utils/config';
import * as github from './github';

/**
 * Visualize the dependencies between files in the TypeScript code base.
 */
export default async function typescriptGraph() {
  await makeGraph();
}

async function makeGraph() {
  readRuntimeConfig();

  // 以下の *_files は src/index.ts のようなパス文字列になっている
  const {
    created,
    deleted,
    modified,
    renamed,
    unchanged: _,
  } = await github.getFiles();
  log('modified:', modified);
  log('created:', created);
  log('deleted:', deleted);
  log('renamed:', renamed);

  // .tsファイルの変更がある場合のみ Graph を生成する。コンパイル対象外の ts ファイルもあるかもしれないがわからないので気にしない
  if (
    ![modified, created, deleted, renamed]
      .flat()
      .some(file => /\.ts|\.tsx/.test(file.filename))
  ) {
    return;
  }

  const { fullHeadGraph, fullBaseGraph, meta } = await getFullGraph();
  log('fullBaseGraph.nodes.length:', fullBaseGraph.nodes.length);
  log('fullBaseGraph.relations.length:', fullBaseGraph.relations.length);
  log('fullHeadGraph.nodes.length:', fullHeadGraph.nodes.length);
  log('fullHeadGraph.relations.length:', fullHeadGraph.relations.length);
  log('meta:', meta);

  // head のグラフが空の場合は何もしない
  if (fullHeadGraph.nodes.length === 0) return;

  const hasRenamed = fullHeadGraph.nodes.some(
    headNode =>
      renamed?.map(({ filename }) => filename).includes(headNode.path),
  );

  if (deleted.length !== 0 || hasRenamed) {
    // ファイルの削除またはリネームがある場合は Graph を2つ表示する
    await output2Graphs(fullBaseGraph, fullHeadGraph, meta, renamed);
  } else {
    await outputGraph(fullBaseGraph, fullHeadGraph, meta, renamed);
  }
}
