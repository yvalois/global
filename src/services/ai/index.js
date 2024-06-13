const {   deleteCallId, deleteRunId, getHistory, deleteThread, newThread, getThread } = require("../../utils/handleHistory");
const OpenAI = require("openai");


class AIClass {
    openai;
    model

    constructor(apiKey, _model) {
        this.openai = new OpenAI({ apiKey, timeout: 15 * 1000 });
        if (!apiKey || apiKey.length === 0) {
            throw new Error("OPENAI_KEY is missing");
        }

        this.model = _model
    }
    /**
     * 
     * @param messages 
     * @param model 
     * @param temperature 
     * @returns 
     */
    createChat = async (
        messages,
        model,
        max_tokens = 326,
        top_p = 0,
        frequency_penalty = 0,
        presence_penalty = 0,
        temperature = 0
    ) => {
        try {
            const completion = await this.openai.chat.completions.create({
                model: model ?? this.model,
                messages,
                temperature: temperature,
                max_tokens: max_tokens,
                top_p: top_p,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty
            });

            return completion.choices[0].message.content;
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    };

    createThread = async (
    ) => {
        try {
            const thread = await this.openai.beta.threads.create();
            return thread.id;
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    };

    restart = async (
        state,
        from,
    )=>{
        try {
            let historial = getHistory(state)
            deleteThread(from)
            newThread(from, await this.createThread())
            for (let index = 0; index < historial.length; index++) {
                this.addMessageWithRole(getThread(from) ,historial[index].content, historial[index].role)
            }
            return historial[historial.length - 1 ].content
        } catch (error) {
            console.error(error);
            return "ERROR";
        }
    }

    createThreadWithFile = async (
        question
    ) => {
        try {
            const thread = await this.openai.beta.threads.create({
                messages:[
                    {
                      role: "user",
                      content: question,
                      attachments: [
                        { file_id: "file-UDJoqDlvR7R4yoV8wgVT1B2V", tools: [{"type": "file_search"}] }
                      ],
                    }
                  ]
            });
            return thread.id;
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    };


    getAnswerOfOtherAss = async (question, goToFlow, state, from) => {
        let thread = await this.createThreadWithFile(question);
        await this.addMessage(thread, question);
        let messages;
        let pollingInterval;
      
        return new Promise((resolve) => {
          this.runAssistant(thread, "asst_SaiEN85nYt4jmbrU2UkGHghx").then(async (run) => {
            const runId = run.id;
            pollingInterval = setInterval(async () => {
              messages = await this.checkingStatus(thread, runId, pollingInterval, goToFlow, state, from);
      
              // Aquí debes verificar si se cumplió la condición para resolver la promesa
              if (messages != undefined) {
                 // <-- Cambia 'messages.resolved' por la condición adecuada
                resolve(messages);
              }
            }, 1000);
          });
        });
      }

    addMessage = async (
        threadId,
        message
    ) => {
        try {
            const response = await this.openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: message,
            });
            return response;
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    };

    addMessageWithRole = async (
        threadId,
        message,
        role
    ) => {
        try {
            const response = await this.openai.beta.threads.messages.create(threadId, {
                role: role,
                content: message,
            });
            return response;
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    };


    runAssistant = async (
        threadId,
        assistantId
    ) => {
        try {
            const response = await this.openai.beta.threads.runs.create(threadId, {
                assistant_id: assistantId,
                temperature: 0.5
            });

            return response;
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    };

    checkingStatus = async (
        threadId,
        runId,
        pollingInterval,
        goToFlow,
        state,
        from
    ) => {
        try {
            const runObject = await this.openai.beta.threads.runs.retrieve(threadId, runId);
            const status = runObject.status;
            let messages = [];
            if (status == "completed") {
                clearInterval(pollingInterval);
                const messagesList = await this.openai.beta.threads.messages.list(threadId);
                messagesList.data.forEach((message) => {
                    messages.push(message.content[0].text.value);
                });
                return messages
            } else if (status == "requires_action") {
                clearInterval(pollingInterval);
                for (const call of runObject.required_action.submit_tool_outputs.tool_calls) {
                    if (call.function.name == "reserva") {

                    }else{ // For no exist functions
                        const toolOutputs = [{
                            tool_call_id: call.id,
                            output: JSON.stringify({ respuesta: "Esta funcion no existe responde la duda del usuario en base al documento o llama la accion correcta."})
                        }]
                        await this.openai.beta.threads.runs.submitToolOutputs(threadId,
                            runId,
                            { tool_outputs: toolOutputs }
                        )
                        let newInterval
                        clearInterval(pollingInterval)
                        await new Promise((resolve) => {
                            newInterval = setInterval(async () => {
                                const runObject2 = await this.openai.beta.threads.runs.retrieve(threadId, runId);
                                const status2 = runObject2.status;
                                if (status2 == "completed") {
                                    clearInterval(newInterval)
                                    const messagesList = await this.openai.beta.threads.messages.list(threadId);
                                    messagesList.data.forEach((message) => {
                                        messages.push(message.content[0].text.value);
                                    });
                                    resolve(messages);
                                }
                            }, 1000);
                        })
                    }
                }

                return messages
            }
        } catch (err) {
            console.error(err);
            return "ERROR";
        }
    };


    checkingToolsOutput = async (
        threadId,
        runId,
        pollingInterval,
        callId, 
        respuesta,
        from, 
        state
    ) => {
        try {
            let toolOutputs = []
            for (let index = 0; index < callId.length; index++) {
                let response 

                if (index > 0) {
                    response = "Esta accion esta mal llamada solo no respondas a esto"
                }else{
                    response = respuesta
                }
                const element = callId[index];
                let output = {
                    tool_call_id: callId[index],
                    output: JSON.stringify({ respuesta: response})
                }
                toolOutputs.push(output)
            }
            let messages = []

            const runObject = await this.openai.beta.threads.runs.retrieve(threadId, runId);
            const status = runObject.status;
            if (status == "requires_action") {
                await this.openai.beta.threads.runs.submitToolOutputs(threadId,
                    runId,
                    { tool_outputs: toolOutputs }
                )
            }
            if(status == "completed"){
                clearInterval(pollingInterval)
                    let newInterval
                    await new Promise((resolve) => {
                        newInterval = setInterval(async () => {
                            const runObject2 = await this.openai.beta.threads.runs.retrieve(threadId, runId);
                            const status2 = runObject2.status;
                            if (status2 == "completed") {
                                deleteCallId(from)
                                deleteRunId(from)
                                clearInterval(newInterval)
                                const messagesList = await this.openai.beta.threads.messages.list(threadId);
                                messages.push(messagesList.data[0].content[0].text.value);
                            }
                            resolve(messages);
                        }, 1000);
                    })
    
            }
            return messages
        } catch (err) {
            console.log("error")
            let messages = await this.restart(state, from)
            console.error(err);
            return messages;
        }
    };
}

module.exports = AIClass;
