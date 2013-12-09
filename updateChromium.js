var request = require('request');
var fs = require('fs');
var child_process = require('child_process');

var windowsVersion = "Win"; // Win_x64 for 64 bit

var getLatestRevision = function(callback){
    
    request('http://chromium.woolyss.com/download/', function(err, res, body) {
        if(err) throw err;

        var findLatestRevisionRegEx = new RegExp('chromium-browser-continuous/'+windowsVersion+'/(\\d{1,})');
        var match = body.match(findLatestRevisionRegEx);
        if(match){
            var revision = match[1];
            callback(revision);
        }
    });
};

var installCheckRevision = function(revision, callback){
    var installed = __dirname + '/INSTALLED'
    
    if(fs.exists(installed, function(exists){
        
        var saveCurrentRev = function(cb) {
            fs.writeFile(installed, revision, cb);
        };
        
        if(!exists){
            saveCurrentRev(function(){
               callback(true); 
            });
        } else {
            fs.readFile(installed, function(err, data){
                if(err) throw err;
                
                var needsUpdate = data < revision;
                
                if(needsUpdate) {
                    saveCurrentRev(function(){
                        callback(true);
                    })
                } else {
                    callback(false);
                }
            });
        }
    }));
};

getLatestRevision(function(revision){
    var installerUrl = 'https://commondatastorage.googleapis.com/chromium-browser-continuous/'+windowsVersion+'/'+revision+'/mini_installer.exe';
    var filename = __dirname + '/' + revision + '_installer.exe';
    
    installCheckRevision(revision, function(needsUpdate){
        
        if(!needsUpdate){
            console.log("Chromium is already up-to-date :)");
            return;
        }
        
        console.log('Downloading installer ...');
        request(installerUrl).pipe(fs.createWriteStream(filename)).on('finish', function() {
            console.log('Installer saved!');
                
            var installProcess = child_process.spawn(filename);
            installProcess.on('close', function(){
                console.log('Chromium ist now up-to-date!');
            });
        });
        
    })
});
