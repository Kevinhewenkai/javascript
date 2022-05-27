import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

let authToken = null;
let authUserId = null;

// which feed has already been loaded
let currentJobPage = 0;
// add the job id each time
let feedJob = [];

const apiCall = (path, method, body) => {
    return new Promise((resolve, reject) => {
        const init = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: (path === 'auth/register' || path === 'auth/login') ? undefined : authToken,
            },
            body: method ==='GET' ? undefined : JSON.stringify(body),
        };

        fetch(`http://localhost:${BACKEND_PORT}/${path}`, init)
            .then(response => response.json())
            .then(body => {
                if (body.error) {
                    showError(body.error);
                } else {
                    resolve(body);
                }
            });
    });
};

const showError = (errorMessage) =>{
    const errorText = document.getElementById('error-text');
    const errorScreen = document.getElementById('error-screen');
    errorScreen.style.display = 'block';
    errorText.textContent = errorMessage;
}

document.getElementById('error-close-button').addEventListener('click', ()=>{
    const errorText = document.getElementById('error-text');
    const errorScreen = document.getElementById('error-screen');
    errorScreen.style.display = 'none';
    errorText.textContent = "";
})

const register = (email, password, name) => {
    return apiCall('auth/register', 'POST', {
        email,
        password,
        name,
    });
};

const login = (email, password) => {
    return apiCall('auth/login', 'POST',{
        email,
        password,
    });
};

const feed = (start) => {
    return apiCall(`job/feed?start=${start}`, 'GET', {});
};

const checkLike = (element, likeButton) =>{
    let like = false;
    for (let i = 0; i < element.likes.length; i++) {
        if (element.likes[i].userId === authUserId) {
            like = true;
        }
    }
    if (like) {
        likeButton.setAttribute("class", "bi bi-heart-fill")
    } else {
        likeButton.setAttribute("class", "bi bi-heart");
    }
};

// build the html tag of job
// screen (the job in which screen)
// element: the job element api call returned
const getJob = (screen, element, name) => {
    const outputInHtml = document.getElementById(screen);
    // The feedPartition contains elements from getProfile
    const jobPartition = document.createElement("div");
    jobPartition.style.border = "1px solid";
    jobPartition.style.backgroundColor = "rgb(255, 255, 235)";
    jobPartition.style.borderRadius = "10px";
    jobPartition.style.margin = "5px";
    jobPartition.style.paddingLeft = "5px";
    jobPartition.style.height = "25vh";
    outputInHtml.appendChild(jobPartition);
    // put elements into feedPartition
    // post name, if name = "" , it means it is called by /user, else is by /job/feed
    if (name) {
        const jobPostName = document.createElement("div");
        jobPostName.setAttribute("class", "feed-post-name");
        jobPostName.addEventListener("click", ()=> {
            showProfile(element.creatorId);
        })
        jobPostName.innerText = `Posted by: ${name}`
        jobPartition.appendChild(jobPostName);
    }

    // post time
    const jobPostTime = document.createElement("div");
    // calculate the time diff
    const postTime = new Date(element.createdAt);
    const currentTime = new Date();
    // const diffDate = Math.floor((currentTime - postTime) / (1000*60*60*24));
    let hourDiff, minutesDiff = 0;
    // if (diffDate === 0) {
    if (currentTime.getDate() - postTime.getDate() === 0) {
        hourDiff = currentTime.getHours()-postTime.getHours();
        if (hourDiff < 0) {
            console.log(currentTime, postTime);
            console.log(currentTime.getHours(), postTime.getHours());
            minutesDiff += 60;
        }
        minutesDiff += currentTime.getMinutes() - postTime.getMinutes();
        jobPostTime.innerText += `Posted: ${hourDiff} Hours ${minutesDiff} minutes before`;
    } else {
        jobPostTime.innerText += `Posted at ${postTime.getDate()}/${postTime.getMonth()+1}/${postTime.getFullYear()}`;
    }
    jobPartition.appendChild(jobPostTime);

    // title
    const jobTitle = document.createElement("div");
    jobTitle.innerText = `Title: ${element.title}`
    jobPartition.appendChild(jobTitle);

    // starting time
    const jobStarting = document.createElement("div");
    const starting = new Date(element.start);
    jobStarting.innerText = `starting at: ${starting.getDate()}/${starting.getMonth()+1}/${starting.getFullYear()}`
    jobPartition.appendChild(jobStarting);

    // description
    const jobDescription = document.createElement("div");
    jobDescription.innerText = `Description: ${element.description}`
    jobPartition.appendChild(jobDescription);

    // likes
    const jobLikes = document.createElement("span");
    // likes amount
    const jobLikeLength = document.createElement('span');
    let likeLength = element.likes.length;
    jobLikeLength.textContent = `likes: ${likeLength}`;
    jobLikes.appendChild(jobLikeLength);
    // the liked username
    const likeList = document.createElement("div");
    likeList.style.display = "none";
    for (let i = 0; i < element.likes.length; i++) {
        let userWhoLikes = document.createElement("span");
        userWhoLikes.innerText = `${element.likes[i].userName} `;
        userWhoLikes.addEventListener("click", () => {
            showProfile(element.likes[i].userId);
        });
        likeList.appendChild(userWhoLikes);
    }
    jobLikes.appendChild(likeList);
    jobLikes.addEventListener("click", () => {
        likeList.style.display = "block";
    });
    // like button
    const likeButton = document.createElement("i");
    likeButton.style.color = "red";
    likeButton.style.paddingLeft = "5px";
    let like;
    // checkLike(element, likeButton, like);
    for (let i = 0; i < element.likes.length; i++) {
        if (element.likes[i].userId === authUserId) {
            like = true;
        }
    }
    if (like) {
        likeButton.setAttribute("class", "bi bi-heart-fill")
    } else {
        likeButton.setAttribute("class", "bi bi-heart");
    }

    likeButton.addEventListener("click", () => {
        apiCall("job/like", "PUT", {"id":element.id, "turnon":!like})
            .then(() => {
                if (like) {
                    likeLength--;
                    likeButton.setAttribute("class", "bi bi-heart");
                    jobLikeLength.textContent = `likes: ${likeLength}`;
                } else {
                    likeLength++;
                    likeButton.setAttribute("class", "bi bi-heart-fill")
                    jobLikeLength.textContent = `likes: ${likeLength}`;
                }
                like = !like;
            })
    });
    jobPartition.appendChild(jobLikes);
    jobPartition.appendChild(likeButton);

    // comments
    const jobComments = document.createElement("div");
    const jobCommentsLength = document.createElement('span');
    let commentLength = element.comments.length;
    jobCommentsLength.textContent = `comments: ${commentLength}`;
    jobComments.appendChild(jobCommentsLength);
    const comments = document.createElement("div");
    comments.style.display = "none";
    for (let i = 0; i < commentLength; i++) {
        let commentContent = document.createElement("div");
        commentContent.innerText = `${element.comments[i].userName}: ${element.comments[i].comment}`;
        commentContent.addEventListener("click", () => {
            showProfile(element.comments[i].userId);
        });
        comments.appendChild(commentContent);
    }
    jobComments.addEventListener("click", ()=>{
        comments.style.display = "block";
    });
    // commentButton
    const commentButton = document.createElement("i");
    commentButton.setAttribute("class", "bi bi-chat-right-dots");
    commentButton.style.paddingLeft = "5px";
    // show a text input and a submit button,
    // the comment button display=none while click
    commentButton.addEventListener('click', ()=> {
        commentButton.style.display = "none";
        const inputComments = document.createElement("input");
        inputComments.type = "text";
        const commentSubmitButton = document.createElement("button");
        commentSubmitButton.innerText = "comment";
        commentSubmitButton.setAttribute("class", "btn btn-primary");

        jobComments.appendChild(inputComments);
        jobComments.appendChild(commentSubmitButton);
        commentSubmitButton.addEventListener('click', ()=>{
            const comment = inputComments.value;
            commentButton.style.display = "block";

            apiCall('job/comment', 'POST', {"id":element.id, comment}).then(()=>{
                // inputComments.innerText = "";
                // length++;
                // jobComments.innerText = `comments: ${length}`;
           });
        });
    });

    jobComments.appendChild(commentButton);

    jobComments.appendChild(comments);
    jobPartition.appendChild(jobComments);

    // live update
    setTimeout(()=>{liveUpdate(element.id, jobLikeLength, jobCommentsLength, likeButton, 0)}, 2000);

    // image
    let img = document.createElement("img");
    img.src = element.image;
    jobPartition.appendChild(img);

    // update and delete button if the job is made by the user
    if (element.creatorId === authUserId) {
        const deleteButton = document.createElement('i');
        deleteButton.setAttribute("class", "bi bi-trash3");
        jobPartition.appendChild(deleteButton);
        const updateButton = document.createElement('i');
        updateButton.setAttribute("class", "bi bi-pencil");
        jobPartition.appendChild(updateButton);
        deleteButton.addEventListener('click', ()=>{
            apiCall('job', 'DELETE', {"id": element.id}).then(()=>{
                jobPartition.style.display = "none";
            });
        });
        updateButton.addEventListener('click', ()=>{
            gotoUpdateJobScreen();

            document.getElementById('update-job-submit-button').addEventListener('click', ()=>{
                let updateTitle = document.getElementById('update-job-title').value;
                let updateDescription = document.getElementById('update-job-description').value;
                let updateImage = document.getElementById('update-job-image').value;
                let updateStartTime = new Date(document.getElementById('update-job-start').value);
                let start = updateStartTime.toISOString();

                apiCall('job', 'PUT', {"id": element.id, "title":updateTitle, "image":updateImage, "start": start, "description": updateDescription})
                .then(()=>{
                    document.getElementById('update-job-screen').reset();
                    gotoScreenWelcome();
                });
            });
        });

    }
};

const getFeedContent = () => {
    feed(currentJobPage).then((body) => {
        for (let i = 0; i< 5; i++) {
            let element = body[i];
            if (element) {
                // in order to get the name of creator
                getProfile(element.creatorId).then((body2) =>{
                    getJob('main-screen', element, body2.name);
                    feedJob.push(element.id);
                });
            }
        }
        currentJobPage += 5;
    });
};

const getProfile = (userId) => {
    return apiCall(`user?userId=${userId}`, 'GET', {});
};

const watchOrUnwatch = (email, turnon) => {
    return apiCall('user/watch', 'PUT', {email, turnon});
}

const showProfile = (userId) => {
    if (userId === authUserId) {
        document.getElementById("changed-button").style.display="block";
    } else {
        document.getElementById("changed-button").style.display="none";
    }
    const email = document.getElementById('profile-email');
    const name = document.getElementById('profile-name');
    const image = document.getElementById('profile-image');
    const watchee = document.getElementById('profile-watcheeUserIds');
    const watchButton = document.getElementById('watch-button');

    getProfile(userId).then((body)=> {
        email.innerText = body.email;
        name.innerText = body.name;
        // show image or not
        if (body.image) {
            image.src = body.image;
            image.style.display="block";
        } else {
            image.src = "";
            image.style.display="none";
        }

        // watcheeUserIds
        watchee.innerText = "Watched by: "
        let watched = false;
        for (let i = 0; i < body.watcheeUserIds.length; i++) {
            //watch or unwatch
            if (authUserId === body.watcheeUserIds[i]){
                watched = true;
            }

            let userName = document.createElement("span");
            getProfile(body.watcheeUserIds[i]).then((body2)=> {
                userName.innerText = `${body2.name} `;
                userName.addEventListener("click", ()=>{
                    showProfile(body2.id);
                })
                watchee.appendChild(userName);
            });
        }
        if (watched) {
            watchButton.setAttribute("class", "bi bi-eye-fill");
        } else {
            watchButton.setAttribute("class", "bi bi-eye");
        }

        watchButton.addEventListener('click', () => {
            watchOrUnwatch(body.email, !watched).then(()=>{
                if (watched) {
                    watchButton.setAttribute("class", "bi bi-eye");
                } else {
                    watchButton.setAttribute("class", "bi bi-eye-fill");
                }
                watched = !watched;
            });
        });

        document.getElementById('profile-job-section').innerText = "";

        for (let i = 0; i < body.jobs.length; i++) {
            getJob('profile-job-section', body.jobs[i], "");
        }

        gotoProfileScreen();
    });
};

document.getElementById('register_button').addEventListener('click', () =>{
    const registerEmail = document.getElementById('register_email').value;
    const registerPassword = document.getElementById('register_password').value;
    const registerConfirmPassword = document.getElementById('register_confirm_password').value;
    const registerName = document.getElementById('register_name').value;

    if (registerPassword !== registerConfirmPassword) {
        alert('password not match');
        return;
    }

    register(registerEmail, registerPassword, registerName).then((body) => {
        authToken = body.token;
        authUserId = body.userId;
        gotoScreenWelcome();
    });
});

document.getElementById('login_button').addEventListener('click', () =>{
    const loginEmail = document.getElementById('login_email').value;
    const loginPassword = document.getElementById('login_password').value;

    login(loginEmail, loginPassword).then((body) => {
        authToken = body.token;
        authUserId = body.userId;
        gotoScreenWelcome();
    });
});

document.getElementById('add-job-button').addEventListener('click', ()=>{
    gotoAddJobScreen();
});

document.getElementById('add-job-submit-button').addEventListener('click', ()=> {
    const title = document.getElementById('add-job-title').value;
    const description = document.getElementById('add-job-description').value;
    let updateStartTime = new Date(document.getElementById('add-job-start').value);
    let start = updateStartTime.toISOString();
    const image = document.getElementById('add-job-image').value;
    apiCall('job', 'POST', {title, image, start, description}).then(()=>{
        gotoScreenWelcome();
    })
});

document.getElementById("profile-button").addEventListener('click', () => {
    showProfile(authUserId);
});

document.getElementById("changed-button").addEventListener('click', ()=>{
    gotoChangeProfileScreen();
});

document.getElementById("changed-submit-button").addEventListener('click', ()=> {
    const email = document.getElementById('changed-email').value;
    const name = document.getElementById('changed-name').value;
    const password = document.getElementById('changed-password').value;
    const image = document.getElementById('changed-image').value;

    apiCall("user", "PUT", {email,password,name, image}).then(()=>{
        showProfile(authUserId);
    });
});

document.getElementById('profile-home-button').addEventListener('click', ()=>{
   gotoScreenWelcome();
});

const gotoScreenWelcome =  () => {
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('register-screen').style.display = "none";
    document.getElementById('main-screen').style.display = "block";
    document.getElementById('profile-screen').style.display = "none"
    document.getElementById('change-profile-screen').style.display = "none";
    document.getElementById('add-job-screen').style.display = "none";
    document.getElementById('update-job-screen').style.display = "none";

    document.getElementById("nav").style.display="none";
    getFeedContent();
};

const gotoScreenLogin =  () => {
    document.getElementById('login-screen').style.display = "block";
    document.getElementById('register-screen').style.display = "none";
    document.getElementById('main-screen').style.display = "none";
    document.getElementById('profile-screen').style.display = "none"
    document.getElementById('change-profile-screen').style.display = "none";
    document.getElementById('add-job-screen').style.display = "none";
    document.getElementById('update-job-screen').style.display = "none";
};

const gotoScreenRegister =  () => {
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('register-screen').style.display = "block";
    document.getElementById('main-screen').style.display = "none";
    document.getElementById('profile-screen').style.display = "none"
    document.getElementById('change-profile-screen').style.display = "none";
    document.getElementById('add-job-screen').style.display = "none";
    document.getElementById('update-job-screen').style.display = "none";
};

const gotoProfileScreen = () => {
    document.getElementById('profile-screen').style.display = "block"
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('register-screen').style.display = "none";
    document.getElementById('main-screen').style.display = "none";
    document.getElementById('change-profile-screen').style.display = "none";
    document.getElementById('add-job-screen').style.display = "none";
    document.getElementById('update-job-screen').style.display = "none";
};

const gotoChangeProfileScreen = () => {
    document.getElementById('change-profile-screen').style.display = "block";
    document.getElementById('profile-screen').style.display = "none"
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('register-screen').style.display = "none";
    document.getElementById('main-screen').style.display = "none";
    document.getElementById('add-job-screen').style.display = "none";
    document.getElementById('update-job-screen').style.display = "none";
};

const gotoAddJobScreen = () => {
    document.getElementById('add-job-screen').style.display = "block";
    document.getElementById('change-profile-screen').style.display = "none";
    document.getElementById('profile-screen').style.display = "none"
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('register-screen').style.display = "none";
    document.getElementById('main-screen').style.display = "none";
    document.getElementById('update-job-screen').style.display = "none";
};


const gotoUpdateJobScreen = () => {
    document.getElementById('update-job-screen').style.display = "block";
    document.getElementById('add-job-screen').style.display = "none";
    document.getElementById('change-profile-screen').style.display = "none";
    document.getElementById('profile-screen').style.display = "none"
    document.getElementById('login-screen').style.display = "none";
    document.getElementById('register-screen').style.display = "none";
    document.getElementById('main-screen').style.display = "none";
};

document.getElementById('nav-register').addEventListener('click', () =>{
    gotoScreenRegister();
});

document.getElementById('nav-login').addEventListener('click', () =>{
    gotoScreenLogin();
});

// infinite scroll
window.addEventListener('scroll', () => {
    if (window.scrollY + window.innerWidth >= 0.6 * document.documentElement.scrollHeight) {
        console.log("1");
        getFeedContent();
    }
});

// live update every 1 second
function liveUpdate(jobId, jobLikeLength, jobCommentsLength, likeButton, startAt) {
    // find the job by jobId
    feed(startAt).then((body)=>{
        for (let j = 0; j < 5; j++) {
            const element = body[j];
            if (element) {
                // find the job
                if (element.id === jobId) {
                    checkLike(element, likeButton);
                    jobLikeLength.textContent = `likes: ${element.likes.length}`;
                    jobCommentsLength.textContent = `comments: ${element.comments.length}`;
                }
                // push notification if someone posted a job
                const currentTime = new Date();
                const date = currentTime.getDate();
                const hour = currentTime.getHours();
                const minute = currentTime.getMinutes();
                const postTime = new Date(element.createdAt);
                const postDate = postTime.getDate();
                const postHour = currentTime.getHours();
                const postMinute = currentTime.getMinutes();
                if (!feedJob.includes(element.id) && postDate===date && postMinute===minute && postHour===hour){
                    getProfile(element.creatorId).then((body2) =>{
                        alert(`${body2.name} create a new job`);
                        console.log(element.id);
                    })
                    feedJob.push(element.id);
                }
            } else {
                startAt = -5;
                break;
            }
        }
    });
    setTimeout(()=>{liveUpdate(jobId, jobLikeLength, jobCommentsLength,likeButton, startAt+5)}, 2000);
}
