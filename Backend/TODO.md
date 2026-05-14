# Backend Mongo Fetch Fix - TODO

## Plan (Step A+B)
- [x] Step A1: Replace `controllers/voiceController.js` with working getAllVoices (admin) + logging
- [x] Step A2: Replace `controllers/postController.js` with working getAllPosts + logging
- [x] Step A3: Replace `controllers/speechController.js` with working getAllSpeeches + logging
- [x] Step A4: Replace `controllers/programController.js` with working getAllPrograms + logging
- [x] Step A5: Replace `controllers/contributorController.js` with working getAllContributors + logging

- [x] Step B1: Updated `server.js` public endpoints to return data regardless of status/published field mismatch (with debug logging)


## Verification
- [ ] Step V1: Restart backend server
- [ ] Step V2: Run `node Backend/test-admin-crud.js` and confirm counts > 0
- [ ] Step V3: curl public endpoints: voices/posts/speeches/programs (+ contributors/board-members if needed)
- [ ] Step V4: curl admin endpoints with token for voices/posts/speeches/programs/contributors/board-members

