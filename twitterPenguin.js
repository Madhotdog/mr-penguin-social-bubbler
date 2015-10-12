var Gpio = require('onoff').Gpio;
var led = new Gpio(14, 'out');

var Twitter = require('twitter');
var Slack = require('node-slack');
var slack = new Slack('https://hooks.slack.com/services/XXXXXXXXXXXXX',null);
var client = new Twitter({
  consumer_key: 'XXXXXXXXXXXXX',
  consumer_secret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  access_token_key: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  access_token_secret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
});
var lastMentionId = null;
var lastFollowerId = null;

function handleNewMention(user, text, id){
        slack.send({
                text: '<https://twitter.com/' + user + '|@' + user + '> just mentioned us, I\'m bubbling with excitement!!! \nhttps://twitter.com/' + user + '/status/' + id
        });


        led.writeSync(1);
        setTimeout( function(){ led.writeSync(0)  }, 18000 ) ;
}

function handleMentions(error, tweets, response){
        console.log('mentions response received');
        if(error){
                console.log(error);
                return;
        }

        for (i = 0; i < tweets.length; i++) {
                if(lastMentionId == null){
                        lastMentionId = tweets[i].id;
                        return;
                }
                else if(lastMentionId < tweets[i].id){
                        console.log("New Mention!");
                        handleNewMention(tweets[i].user.screen_name, tweets[i].text, tweets[i].id_str);
                }
        }
        lastMentionId = tweets[0].id;
}

function handleNewFollower(user){
        slack.send({
                text: '<https://twitter.com/' + user + '|@' + user + '> just followed us, Unbelievabubble!!!'
        });

        led.writeSync(1);
        setTimeout( function(){ led.writeSync(0)  }, 21000 ) ;
}

function handleFollowers(error, followers, response){
        console.log('Followers response received');
        if(error){
                console.log(error);
                return;
        }
        for (i = 0; i < followers.length; i++) {
                if(lastFollowerId == null){
                        // on first run
                        lastFollowerId = followers[i].id;
                        return;
                }
                else if(lastFollowerId != followers[i].id){
                        console.log("New Follow!");
                        handleNewFollower(followers[i].screen_name);
                }
                else if(lastFollowerId == followers[i].id){
                        lastFollowerId = followers[0].id;
                        return;
                }
        }
        lastFollowerId = followers[0].id;
}

function handleFollowerResponse(error, followerIds, response){
        console.log('Follower ID response received');
        if(error){
                console.log(error);
                return;
        }
        client.get('users/lookup', {user_id: followerIds.ids.join(", ")}, handleFollowers);
}

function update(){
        console.log('Polling!');
        client.get('statuses/mentions_timeline', handleMentions);
        client.get('followers/ids', {count: 10}, handleFollowerResponse);

}

update();
setInterval(update, 1000*60);