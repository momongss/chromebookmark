export const bfs = (graph, startNode) => {
  const visited = []; // 탐색을 마친 노드들
  let needVisit = []; // 탐색해야할 노드들

  needVisit.push(startNode); // 노드 탐색 시작

  while (needVisit.length !== 0) {
    // 탐색해야할 노드가 남아있다면
    const node = needVisit.shift(); // queue이기 때문에 선입선출, shift()를 사용한다.
    if (!visited.includes(node)) {
      // 해당 노드가 탐색된 적 없다면
      visited.push(node);
      needVisit = [...needVisit, ...graph[node]];
    }
  }
  return visited;
};
