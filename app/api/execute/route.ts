import { NextRequest, NextResponse } from "next/server";
import { TaskType } from "../../components/types";
import { ChatOpenAI } from "@langchain/openai";
import {
	SystemMessagePromptTemplate,
	HumanMessagePromptTemplate,
	ChatPromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function POST(req: NextRequest) {
	try {
		// 目的、タスクリスト、最後のタスク、結果, タスクIDを取得
		const { objective, taskList, task, result } = await req.json();

		// OpenAIのモデル
		const chat = new ChatOpenAI({
			openAIApiKey: process.env.OPENAI_API_KEY,
			modelName: "gpt-3.5-turbo",
			temperature: 0.7,
		});

		// プロンプト
		const chatPrompt = ChatPromptTemplate.fromMessages([
			SystemMessagePromptTemplate.fromTemplate(
				"You are an AI task creation agent. You have the following objective: {objective}. Please answer in Japanese."
			),
			HumanMessagePromptTemplate.fromTemplate(
				"You have the following incomplete tasks: {tasks} and have just executed the following task: {lastTask} and received the following result: {result}. Based on this, create a new task to be completed by your AI system such that your goal is more closely reached or completely reached. Return the result as a numbered list, like: #. First task #. Second task. Always start the task list with the number {nextTaskID}."
			),
		]);

		// チェーンの作成
		const chain = chatPrompt.pipe(chat).pipe(new StringOutputParser());

		// タスクリストから文字列を作成
		const taskNamesString = taskList
			.map((task: TaskType) => task.taskName)
			.join(", ");

		// 次のタスクのIDを設定
		const nextTaskID = (Number(task.taskID) + 1).toString();

		// タスク生成を実行
		const resultTaskCreate = await chain.invoke({
			objective,
			tasks: taskNamesString,
			lastTask: task.taskName,
			result,
			nextTaskID,
		});

		const newPrioritizeTaskList = [];
		for (const newPrioritizeTask of resultTaskCreate.split("\n")) {
			// タスクIDとタスク名に分割
			const taskParts = newPrioritizeTask.trim().split(". ", 2);
			// タスクIDとタスク名がある場合
			if (taskParts.length === 2) {
				// タスクIDとタスク名を取得
				const taskID = taskParts[0].trim();
				const taskName = taskParts[1].trim();
				// 新しいタスクリストに追加
				newPrioritizeTaskList.push({ taskID, taskName });
			}
		}

		return NextResponse.json({ response: newPrioritizeTaskList });
	} catch (error) {
		console.log("error", error);
		return NextResponse.error();
	}
}
