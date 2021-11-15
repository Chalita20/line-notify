module.exports = function(RED) {
    'use strcit';

    const axios = require('axios');
    const qs = require('querystring');
    const BASE_URL = 'https://notify-api.line.me';
    const PATH =  '/api/notify';

    function validateString(value){
        return typeof value === 'string'
    }

    function LineNotifyNode(n) {
        RED.nodes.createNode(this, n);
        this.message = n.message;
        if (RED.nodes.getNode(n.creds)){
            this.accessToken = RED.nodes.getNode(n.creds).credentials.accessToken;
        } else {
            this.accessToken = "";
        }
        let node = this;

        node.on('input', function(msg) {
            if(!node.accessToken){
                msg.payload = "token is empty";
                msg.status = -1;
                sendError(node, msg);
                return;
            }
            let dataJson = {
                message: node.message
            };
            if(validateString(msg.payload)){
                if(!dataJson.message){
                    dataJson.message = msg.payload;
                }else{
                    node.warn(RED._("line-notify-api.warn.noOverride.message"));
                }    
            }
            if(node.silent){
                dataJson.notificationDisabled = true;
            }
            let lineConfig = {
                baseURL: BASE_URL,
                url: PATH,
                method: 'post',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer ' + node.accessToken
                },
                data: qs.stringify(trimDataJson(dataJson))
            };

            axios.request(lineConfig).then((res) => {
                msg.status = res.data.status;
                node.send(msg);
                node.status({fill: "blue", shape: "dot", text: "success"});
            })
            .catch((error) => {
                msg.status = error.response.data.status;
                msg.payload = error.response.data.message;
                sendError(node, msg);
            });
        });
    }

    function lineToken(n){
        RED.nodes.createNode(this, n);
        this.accessToken = n.accessToken;
    }

    RED.nodes.registerType("line-notify-api", LineNotifyNode, {
        credentials: {
            accessToken: {type:"text"}
        }
    });

    RED.nodes.registerType("linetoken", lineToken,{
        credentials: {
          accessToken: {type:"text"}
        }
    });
}