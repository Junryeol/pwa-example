/* NOTE:
    https://developer.github.com/v3/
    Not support org, branch, request
    Not implemented everything
*/

function Github() {
    this.init();
}

Github.prototype.init = function() {
    this.user_name = "";
    this.authentication = "";
}

/* User Auth */
Github.prototype.basicAuth = function(user_name_or_email, password) {
    var that = this;
    this.authentication = "Basic " + btoa(user_name_or_email + ":" + password);
    return this.get("https://api.github.com/user").then(function(data) {
        that.user_name = data.login;
        return data;
    });
}
Github.prototype.tokenAuth = function(token) {
    var that = this;
    this.authentication = "Token " + token;
    return this.get("https://api.github.com/user").then(function(data) {
        that.user_name = data.login;
        return data;
    });
}
Github.prototype.user = function() {
    return this.get("https://api.github.com/user");
}
Github.prototype.logout = function() {
    this.user_name = "";
    this.authentication = "";
}

/* Repository */
Github.prototype.getReposList = function(owner_name, option = {}) {
    return this.get("https://api.github.com/users/" + owner_name + "/repos", option);
}
Github.prototype.getRepos = function(owner_name, repos_name) {
    return this.get("https://api.github.com/repos/" + owner_name + "/" + repos_name, {});
}
Github.prototype.createRepos = function(repos_name, option = {}) {
    var params = Object.assign({}, option, {
        name: repos_name
    });
    return this.post("https://api.github.com/user/repos", params);
}
Github.prototype.editRepos = function(owner_name, repos_name, option) {
    return this.patch("https://api.github.com/repos/" + owner_name + "/" + repos_name, option);
}
Github.prototype.deleteRepos = function(owner_name, repos_name) {
    return this.delete("https://api.github.com/repos/" + owner_name + "/" + repos_name);
}
Github.prototype.transferRepos = function(owner_name, repos_name, new_owner_name, option = {}) {
    var params = Object.assign({}, option, {
        new_owner: new_owner_name
    });
    return this.post("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/transfer", params);
}
Github.prototype.forkRepos = function(owner_name, repos_name, option = {}) {
    return this.post("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/forks", option);
}

/* Commit Comment */
Github.prototype.getLastCommit = function(owner_name, repos_name, branch_name="master") {
    return this.get("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/commits/" + branch_name, null);
}
Github.prototype.getCommitList = function(owner_name, repos_name, branch_name="master") {
    return this.get("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/commits/" + branch_name, null);
}

/* Directory File */
Github.prototype.getRoot = function(owner_name, repos_name, branch_name="master", option = {}) {
    var that = this;
    return this.getLastCommit(owner_name, repos_name, branch_name).then(function(data) {
        var sha = data.commit.tree.sha;
        return that.get("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/git/trees/" + sha, option);
    });
}
Github.prototype.getContent = function(owner_name, repos_name, file_path, option = {}) {
    return this.get("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/contents/" + file_path, option);
}
Github.prototype.createContent = function(owner_name, repos_name, file_path, content, commit_message = "create file", option = {}) {
    delete option.sha
    var params = Object.assign({}, option, {
        content: content,
        message: commit_message
    });
    return this.put("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/contents/" + file_path, params);
}
Github.prototype.updateContent = function(owner_name, repos_name, file_path, content, commit_message = "update file", option = {}) {
    var that = this;
    return this.getContent(owner_name, repos_name, file_path).then(function(data) {
        var params = Object.assign({}, option, {
            content: content,
            message: commit_message,
            sha: data.sha
        });
        return that.put("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/contents/" + file_path, params);
    });
}
Github.prototype.deleteContent = function(owner_name, repos_name, file_path, commit_message = "delete file", option = {}) {
    var that = this;
    return this.getContent(owner_name, repos_name, file_path).then(function(data) {
        var params = Object.assign({}, option, {
            message: commit_message,
            sha: data.sha
        });
        return that.delete("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/contents/" + file_path, params);
    });
}
Github.prototype.copyContent = function(owner_name, repos_name, file_path, new_file_path, commit_message = "copy file", option = {}) {
    var that = this;
    delete option.sha
    return this.getContent(owner_name, repos_name, file_path).then(function(data) {
        var params = Object.assign({}, option, {
            content: data.content,
            message: commit_message
        });
        return that.put("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/contents/" + new_file_path, params);
    });
}
Github.prototype.moveContent = function(owner_name, repos_name, file_path, new_file_path, commit_message = "move file", option = {}) {
    /* WARNING:
        It's not exactly moving.
    */
    var that = this;
    delete option.sha
    return this.getContent(owner_name, repos_name, file_path).then(function(data) {
        var params = Object.assign({}, option, {
            content: data.content,
            message: commit_message
        });
        return that.put("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/contents/" + new_file_path, params).then(function() {
            var params = Object.assign({}, option, {
                message: commit_message,
                sha: data.sha
            });
            return that.delete("https://api.github.com/repos/" + owner_name + "/" + repos_name + "/contents/" + file_path, params);
        });
    });
}

/* Search */
Github.prototype.searchFile = function(owner_name, repos_name, file_query) {
    var params = {
        q:"filename:" + file_query + "+repo:" + owner_name + "/" + repos_name
    }
    return this.get("https://api.github.com/search/code", params);
}
Github.prototype.searchText = function(owner_name, repos_name, text_query, file_query="") {
    /* WARNING:
        The repos name must not be the beginning of another repos name.
    */
    /* NOTE:
        Only the default branch is considered. In most cases, this will be the master branch.
        Only files smaller than 384 KB are searchable.
        Queries are longer than 256 characters (not including operators or qualifiers).
        Queries have more than five AND, OR, or NOT operators.
    */
    if (file_query){
        var params = {
            q:text_query + "+filename:" + file_query + "+repo:" + owner_name + "/" + repos_name
        }
        return this.get("https://api.github.com/search/code", params);
    }
    var params = {
        q:text_query + "+repo:" + owner_name + "/" + repos_name
    }
    return this.get("https://api.github.com/search/code", params);
}
Github.prototype.searchUser = function(user_query) {
    var params = {
        q:user_query
    }
    return this.get("https://api.github.com/search/users", params);
}
Github.prototype.searchRepos = function(repositories_query) {
    var params = {
        q:repositories_query
    }
    return this.get("https://api.github.com/search/repositories", params);
}

/* Traffic */
Github.prototype.trafficReferrers = function(owner_name, repos_name) {
    return this.get("https://api.github.com/repos/"+owner_name+"/"+repos_name+"/traffic/popular/referrers", null);
}
Github.prototype.trafficPaths = function(owner_name, repos_name) {
    return this.get("https://api.github.com/repos/"+owner_name+"/"+repos_name+"/traffic/popular/paths", null);
}
Github.prototype.trafficViews = function(owner_name, repos_name) {
    return this.get("https://api.github.com/repos/"+owner_name+"/"+repos_name+"/traffic/popular/views", null);
}

/* Starring */
Github.prototype.stargazers = function(owner_name, repos_name) {
    return this.get("https://api.github.com/repos/"+owner_name+"/"+repos_name+"/stargazers", null);
}
Github.prototype.starred = function(owner_name, repos_name) {
    return this.get("https://api.github.com/user/starred/"+owner_name+"/"+repos_name, null);
}
Github.prototype.starring = function(owner_name, repos_name) {
    return this.put("https://api.github.com/user/starred/"+owner_name+"/"+repos_name, null);
}
Github.prototype.unstarring = function(owner_name, repos_name) {
    return this.delete("https://api.github.com/user/starred/"+owner_name+"/"+repos_name, null);
}

/* Gist Comment */
Github.prototype.getGistList = function(user_name, option={}) {
    return this.get("https://api.github.com/users/"+user_name+"/gists", option);
}
Github.prototype.getGist = function(gist_id) {
    return this.get("https://api.github.com/gists/"+gist_id, null);
}
Github.prototype.createGist = function(file_name, content, option={}) {
    if (!option.files)
        option.files = {};

    option.files[file_name].content = content;

    return this.post("https://api.github.com/gists", option);
}
Github.prototype.editGist = function(gist_id, file_name, content, new_file_name=null, option={}) {
    if (!option.files)
        option.files = {};

    if (!new_file_name)
        option.files[file_name].filename = new_file_name

    option.files[file_name].content = content;

    return this.patch("https://api.github.com/gists/"+gist_id, option);
}
Github.prototype.deleteGist = function(gist_id) {
    return this.delete("https://api.github.com/gists/"+gist_id);
}
Github.prototype.getGistCommentList = function(gist_id) {
    return this.get("https://api.github.com/gists/"+gist_id+"/comments",null);
}
Github.prototype.getGistComment = function(gist_id,comment_id) {
    return this.get("https://api.github.com/gists/"+gist_id+"/comments/"+comment_id, null);
}
Github.prototype.createGistComment = function(gist_id, text) {
    return this.post("https://api.github.com/gists/"+gist_id+"/comments", {body:text});
}
Github.prototype.editGistComment = function(gist_id, comment_id, text) {
    return this.patch("https://api.github.com/gists/"+gist_id+"/comments/"+comment_id, {body:text});
}
Github.prototype.deleteGistComment = function(gist_id,comment_id) {
    return this.delete("https://api.github.com/gists/"+gist_id+"/comments/"+comment_id, null);
}

/* Restful API */
Github.prototype.get = function(address, params) {
    if (!params)
        params = {};
    var query = Object.keys(params).map(function(key) {
        return key + '=' + params[key]
    }).join('&');
    return this.restful('GET',address + "?" + query, null);
}
Github.prototype.post = function(address, params) {
    return this.restful('POST',address,params);
}
Github.prototype.put = function(address, params) {
    return this.restful('PUT',address,params);
}
Github.prototype.delete = function(address, params) {
    return this.restful('DELETE',address,params);
}
Github.prototype.patch = function(address, params) {
    return this.restful('PATCH',address,params);
}
Github.prototype.restful = function(method, address, params) {
    var authentication = this.authentication;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.onload = function() {
            if(xhr.responseText)
                resolve(JSON.parse(xhr.responseText));
        };

        xhr.open(method, address);

        if (authentication){
            xhr.setRequestHeader("Authorization", authentication);
        }

        if (params)
            xhr.send(JSON.stringify(params));
        else
            xhr.send();
    });
}

const github = new Github();
