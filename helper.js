(function (){
    function queryAnswserByQuestionId(qid){
        return localStorage.getItem('qid:' + qid);
    }

    function saveAnswserId(qid,aid){
        return localStorage.setItem('qid:' + qid,aid);
    }
    function sendAnswer(q,a){

        //sleep and auto anser
        var sleep = Math.floor(Math.random() * 1000) + 500;
        
        try{
            GameApp.socketManager.send("PKMain","Answer",{answerID:a,timer:sleep});
        }catch(e){
            console.log(e);
        }

        //GameApp.socketManager.send("PKMain","Answer",{answerID:t,timer:e}))
    }


    if(window.GameApp && window.GameApp.socketManager)
    {
        var currentUID = GameApp.dataManager.userVo.uid;
        var currentQuestion = {qid:0,aid:0,done:false};

        if(GameApp.socketManager.send ){
            var _send = window.GameApp.socketManager.send;
            function hookSend(){
                var objThis = window.GameApp.socketManager;
                var args = Array.prototype.slice.apply(arguments);

                var mcmd = args[0];
                var scmd = args[1];
                var data = args[2];
                if(mcmd == "PKMain" && scmd == "Answer"){

                    if(currentQuestion.done){
                        return;
                    }
                    else{
                        currentQuestion.done = true;

                        if(data.timer > 2000){
                            data.timer = 1500;
                        }
                    }
                    
                }
                console.log('Send: ' + mcmd + scmd);
                console.dir(data);
                return _send.apply(objThis,args);
            }

            hookSend.__hooked__ = true;

            if(_send && !_send.__hooked__){

                window.GameApp.socketManager.send = hookSend;
            }

        }

        if(window.GameApp.socketManager.emit){

            var _emit = window.GameApp.socketManager.emit;

            function hookEmit(){
                var objThis = window.GameApp.socketManager;
                var args = Array.prototype.slice.apply(arguments);

                if(args.length == 2){
                    var cmd = args[0];
                    var data = args[1];
                    console.log('Recv: ' + cmd);
                    console.dir(data);
                    if(cmd == "PKMainNextQuestion"){

                    
                        var questionContent = data.questionContent;
                        var questionID = data.questionID;
                        var anser = queryAnswserByQuestionId(questionID);
                        currentQuestion.qid = questionID;
                        currentQuestion.aid = anser;
                        currentQuestion.done = false;
                        if(anser){
                            data.answers.forEach(n=>{
                                if(n.answerID == anser){
                                    n.content = "* " + n.content + " *";
                                }
                            });

                            setTimeout(function(){
                                 GameApp.uiManager.showToast('正确回答');
                                sendAnswer(questionID, anser);
                            },1000);
                            
                        }

                    }
                    else if(cmd == 'PKMainAnswerResult'){

                        if(!currentQuestion.done){

                            if(currentUID != data.answerResult.userAnswerID){
                                if(data.answerResult.isCorrect){
                                    console.log('auto answer:' + data.answerResult.userAnswerID);
                                    GameApp.uiManager.showToast('自动回答');
                                    sendAnswer(currentQuestion.qid,data.answerResult.userAnswerID);
                                }
                               
                            }
                           
                        }
                    }
                    else if(cmd == 'PKMainAnswerResultCorrect'){
                        console.log('PKMainAnswerResultCorrect');
                        console.dir(data);

                        saveAnswserId(currentQuestion.qid,data.correctAnswerID);
                        console.log('save answerID:' + data.correctAnswerID);


                    }
                }

                return _emit.apply(objThis,args);
            }
            hookEmit.__hooked__ = true;

            if(_emit && !_emit.__hooked__){

                window.GameApp.socketManager.emit = hookEmit;
               
            }
         }
         GameApp.uiManager.showToast('开挂的人生');

    }
    else{
        setTimeout(arguments.callee,500);
    }

})();
