class Github{
    constructor(){
        this.baseURL = "https://api.github.com";
        this.repos_name = "test";

        this.user_name = "";
        this.authentication = "";
    }

    basicAuth(user_name_or_email, password) {
        this.authentication = "Basic " + btoa(user_name_or_email + ":" + password);
        return this.getUser().then((data)=>{
            this.user_name = data.login;
            return data;
        });
    }
    tokenAuth(token) {
        this.authentication = "Token " + token;
        return this.getUser().then((data)=>{
            this.user_name = data.login;
            return data;
        });
    }
    AuthOut() {
        this.user_name = "";
        this.authentication = "";
    }
    getUser() {
        return this.get("/user");
    }
    
    getLastCommit() {
        return this.get(`/repos/${this.user_name}/${this.repos_name}/commits/master`);
    }
    getRoot() {
        return this.getLastCommit().then((data)=>{
            return this.getTree(data.commit.tree.sha);
        });
    }
    
    getContent (file_path) {
        return this.get(`/repos/${this.user_name}/${this.repos_name}/contents/${file_path}`);
    }
    createContent(file_path, base64_data) {
        return this.put(`/repos/${this.user_name}/${this.repos_name}/contents/${file_path}`, {
            content: base64_data,
            message: "create content"
        });
    }
    updateContent(file_path, base64_data) {
        return this.getContent(file_path).then((data)=>{
            return this.put(`/repos/${this.user_name}/${this.repos_name}/contents/${file_path}`, {
                content: base64_data,
                message: "update content",
                sha: data.sha
            });
        });
    }
    deleteContent(file_path) {
        return this.getContent(file_path).then((data)=>{
            return this.delete(`/repos/${this.user_name}/${this.repos_name}/contents/${file_path}`, {
                message: "delete content",
                sha: data.sha
            });
        });
    }

    getTree(sha){
        return this.get(`/repos/${this.user_name}/${this.repos_name}/git/trees/${sha}`);
    }
    getBlob(sha){
        return this.get(`/repos/${this.user_name}/${this.repos_name}/git/blobs/${sha}`);
    }
    createBlob(base64_data){
        return this.post(`/repos/${this.user_name}/${this.repos_name}/git/blobs`,{
            content: base64_data,
            encoding: "base64"
        });
    }

    get(address, params = {}) {
        let query = Object.keys(params).map((key)=>{
            return `${key}=${params[key]}`;
        }).join('&');
        return this.restful('GET',`${address}?${query}`, null);
    }
    post(address, params){
        return this.restful('POST',address,params);
    }
    put (address, params) {
        return this.restful('PUT',address,params);
    }
    delete (address, params) {
        return this.restful('DELETE',address,params);
    }
    patch (address, params) {
        return this.restful('PATCH',address,params);
    }
    restful (method, address, params) {
        let option = {method: method};
        if(this.authentication){
            option.headers = new Headers({"Authorization": this.authentication});
        }
        if(params){
            option.body = JSON.stringify(params);
        }
        return fetch(this.baseURL + address, option).then((data)=>{
            return data.json();
        });
    }
}

const github = new Github();
