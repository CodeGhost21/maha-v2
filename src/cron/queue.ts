type TaskFunction = () => Promise<void>;

const queue: TaskFunction[] = [];

export function addToQueue(task: TaskFunction): void {
  console.log("pushing task in queue", queue.length);
  queue.push(task);
  if (queue.length === 1) {
    runNextTask();
  }
}

export const isQueueEmpty = () => {
  if (queue.length) {
    return false;
  }
  return true;
};

async function runNextTask(): Promise<void> {
  if (queue.length === 0) {
    return;
  }
  const task = queue[0];
  await task();
  queue.shift();
  console.log("popping task from queue", queue.length);
  runNextTask();
}
