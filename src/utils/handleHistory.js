let asesoria = {}

let threads = {}
let runId = {}
let callId = {}

let queue = {}

const inQueue =(from, status)=>{
    queue[from] = status
}

const getQueue =(from) => {
    return queue[from]
}

const newThread=(from, thread)=>{
    threads[from] = [thread, new Date()];
}

const deleteQueue= (from) =>{
    delete queue[from]
}

const getThread=(from)=>{
    return threads[from][0];
}

const getThreads=()=>{
    return threads;
}

const updateThread=(from)=>{
    threads[from] = [threads[from][0], new Date()];
}

const deleteThread =(from)=>{
    delete threads[from]
}

const newRunId=(from, RunId)=>{
    runId[from] = RunId;
}

const getRunId=(from)=>{
    return runId[from];
}

const deleteRunId =(from)=>{
    delete runId[from]
}

const newCallId = (from, CallId) => {
    if (!callId[from]) {
      callId[from] = [CallId];
    }else{
        callId[from].push(CallId);
    }

  }

const getCallId=(from)=>{
    return callId[from];
}

const deleteCallId =(from)=>{
    delete callId[from]
}


const getAsesoria =()=>{
    return asesoria
}

const newUser=(from)=>{
    asesoria[from] = new Date();
}

const deleteUser =(from)=>{
    delete asesoria[from]
}

const handleHistory = async (inside, _state) => {
    const history = _state.get('history') ?? []
    history.push(inside)
    await _state.update({ history })
}

const getHistory = (_state, k = 6) => {
    const history = _state.get('history') ?? []
    const limitHistory = history.slice(-k)
    return history
}

const getHistoryToFlow = (_state, k = 10) => {
    const history = _state.get('history') ?? []
    const limitHistory = history.slice(-k)
    return limitHistory 
}

const getHistoryParse = (_state, k = 6) => {
    const history = _state.get('history') ?? []
    const limitHistory = history.slice(-k)
    return history.reduce((prev, current) => {
        const msg = current.role === 'user' ? `\nCliente: "${current.content}"` : `\nVendedor: "${current.content}"`
        prev += msg
        return prev
    }, ``)
}

const getHistoryParseToFlow = (_state, k = 6) => {
    const history = _state.get('history') ?? []
    const limitHistory = history.slice(-k)
    return limitHistory.reduce((prev, current) => {
        const msg = current.role === 'user' ? `\nCliente: "${current.content}"` : `\nVendedor: "${current.content}"`
        prev += msg
        return prev
    }, ``)
}

const getHistoryParse2 = (_state, k = 15) => {
    const history = _state.get('history') ?? []
    const limitHistory = history.slice(-k)
    return limitHistory.reduce((prev, current) => {
        const msg = current.role === 'user' ? `\nCliente: "${current.content}"` : `\nVendedor: "${current.content}"`
        prev += msg
        return prev
    }, ``)
}

const getHistoryForChat = (_state) => {
    return _state.get('history') ?? []

}

const clearHistory = async (_state) => {
    _state.clear()
}


module.exports = { 
    handleHistory, 
    getHistory, 
    getHistoryParse, 
    clearHistory, 
    getHistoryForChat,
    getHistoryParse2, 
    getAsesoria, 
    newUser, 
    deleteUser, 
    getHistoryParseToFlow, 
    getHistoryToFlow,
    newThread, 
    getThread, 
    deleteThread, 
    newRunId, 
    getRunId, 
    deleteRunId, 
    newCallId, 
    getCallId, 
    deleteCallId, 
    getThreads,
    updateThread,
    inQueue,
    getQueue,
    deleteQueue
    }