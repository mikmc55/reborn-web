{"token": "ya29.a0AWY7CknFe5N8g9cpsAO8xcpAg5n8KdpLE4qthNqYRVPCfSnL1NzH7V21a0xS1OZ5aN0WUsTHucccMFh7ZoBolGQQnBVQg4sfxvzWh0ObkV3GrFY86Ncly_q-5PC98r3ZVMj1A4n3TYji7eW4ZWSVqEHKpM6OaCgYKAbkSARMSFQG1tDrpPCIrOVR-335mPTy2HlMX-g0163", "refresh_token": "1//0dRZjQL9r3_ySCgYIARAAGA0SNwF-L9IrapXSf_RfvDDNq9iT_7YRPiCDZlP6f2wYc_t25pY33l3wKl5mE_GlvV6Nkiq6T7mNLys", "token_uri": "https://oauth2.googleapis.com/token", "client_id": "4578087361-3f5uq2r9a06qclp48ahq32nkns79uk19.apps.googleusercontent.com", "client_secret": "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", "scopes": ["https://www.googleapis.com/auth/drive"]}


2. Copy the code for cloudflare workers:

var credentials = {"client_id": "4578087361-3f5uq2r9a06qclp48ahq32nkns79uk19.apps.googleusercontent.com","client_secret": "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","refresh_token": "1//0dRZjQL9r3_ySCgYIARAAGA0SNwF-L9IrapXSf_RfvDDNq9iT_7YRPiCDZlP6f2wYc_t25pY33l3wKl5mE_GlvV6Nkiq6T7mNLys"};

async function handleRequest(request) {
  const drive = new gdrive(credentials)
  let url = new URL(request.url)
  let path_split = url.pathname.split('/')
  if (path_split[1] == 'load') {
    var file_id = path_split[2]
    var file_name = path_split[3] || 'file_name.vid'
    return drive.streamFile(request.headers.get("Range"), file_id, file_name)
  }
  else if (url.pathname == '/')
      return new Response('200 Online!', { "status": 200 })
  else
      return new Response('404 Not Found!', { "status": 404 })
}

class gdrive {
  constructor(credentials) {
    this.gapihost = 'https://www.googleapis.com'
    this.credentials = credentials
  }
  async streamFile(range = "", file_id, file_name) {
    //console.log(`streamFile: ${file_id}, range: ${range}`)
    let fetchURL = `${this.gapihost}/drive/v3/files/${file_id}?alt=media`
    let fetchData = await this.authData()
    fetchData.headers['Range'] = range
    let streamResp = await fetch(fetchURL, fetchData)
    let { readable, writable } = new TransformStream()
    streamResp.body.pipeTo(writable)
    return new Response(readable, streamResp)
  }
  async accessToken() {
    //console.log("accessToken")
    if (!this.credentials.token || this.credentials.token.expires_in < Date.now()) {
      this.credentials.token = await this.fetchAccessToken()
      this.credentials.token.expires_in = Date.now() + this.credentials.token.expires_in * 1000
    }
    return this.credentials.token.access_token
  }
  async fetchAccessToken(url = `${this.gapihost}/oauth2/v4/token`) {
    //console.log("fetchAccessToken")
    let jsonBody = {
      'client_id': this.credentials.client_id,
      'client_secret': this.credentials.client_secret,
      'refresh_token': this.credentials.refresh_token,
      'grant_type': 'refresh_token'
    }
    let response = await fetch(url, { method: 'POST', body: JSON.stringify(jsonBody) })
    return await response.json()
  }
  async authData(headers = {}) {
    headers['Authorization'] = `Bearer ${await this.accessToken()}`;
    return { 'method': 'GET', 'headers': headers }
  }
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request))
})
