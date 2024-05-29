type TaskFunction = () => Promise<void>;

const queue: TaskFunction[] = [];

export async function addToQueue(task: TaskFunction): Promise<void> {
  console.log("pushing task in queue", queue.length, queue);
  queue.push(task);
  if (queue.length === 1) {
    await runNextTask();
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
  await runNextTask();
}
