import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import {
	SystemMessagePromptTemplate,
	HumanMessagePromptTemplate,
	ChatPromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function POST(req: NextRequest) {
	try {
		// 目的とタスクを取得
		const { objective, task } = await req.json();

		// OpenAIのモデル
		const chat = new ChatOpenAI({
			openAIApiKey: process.env.OPENAI_API_KEY,
			modelName: "gpt-3.5-turbo",
			temperature: 0.7,
		});

		// プロンプト
		const chatPrompt = ChatPromptTemplate.fromMessages([
			SystemMessagePromptTemplate.fromTemplate(
				"You are an AI who performs one task based on the following objective: {objective}. Please answer in Japanese."
			),
			HumanMessagePromptTemplate.fromTemplate(
				"Your task: {task}. Response:"
			),
		]);

		// チェーンの作成
		const chain = chatPrompt.pipe(chat).pipe(new StringOutputParser());

		// 実行
		const response = await chain.invoke({ objective, task });

		return NextResponse.json({ response });
	} catch (error) {
		console.log("error", error);
		return NextResponse.error();
	}
}
