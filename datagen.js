/**
 * 在某社会关系网络系统中，一个人属性包括所在地区、就读的各级学校、工作单
 * 位等，每一人有众多好友，并可以根据个人兴趣及社会活动加入到某些群组。现需设计
 * 一算法，从该社会关系网络中某一人出发，寻找其可能认识的人。例如根据两个人共同
 * 好友的数量及所在群组情况，来发现可能认识的人；通过就读的学校情况发现可能认识
 * 的同学。 
 * 
 */

// Requirements
const fs = require('fs');
const LoremIpsum = require("lorem-ipsum").LoremIpsum;

// Settings
const genNums = {
    user: 50,
    edu: 4,
    work: 5,
    group: 8,
    groupUserMin: 10,
    groupUserMax: 100,
    ageMin: 12,
    ageMax: 32,
    friendRate: 0.1
};

const loremConfig = {
    sentencesPerParagraph: {
      max: 8,
      min: 4
    },
    wordsPerSentence: {
      max: 16,
      min: 4
    }
};

// Instances
const lorem = new LoremIpsum(loremConfig);

// Testcase
// for (let i = 0; i < genNums.user; i++) {
//     console.log(lorem.generateWords(1));
// }

// Definition
const users = [];
const edus = [];
const works = [];
const groups = [];

// General Assistance Functions
const genRange = (min, max) => {
    return min + Math.floor(Math.random() * (max - min));
};

// Specific Assistance Functions
const joinRandom = (num, max = 0) => {
    let arr = [];
    if (max) {
        if (max > num) {
            max = num;
        }
        const acnum = genRange(0, max);
        let used = [];
        for (let i = 0; i < acnum; i++) {
            let newNum = genRange(0, num);
            while (used[newNum]) {
                newNum = genRange(0, num);
            }
            arr.push(newNum);
            used[newNum] = true;
        }
    } else {
        for (let i = 0; i < num; i++) {
            if (Math.round(Math.random())) {
                arr.push(i);
            }
        }
    }
    return arr;
};

// Generate
for (let i = 0; i < genNums.user; i++) {
    const usr = {
        id: i,
        name: 'User ' + lorem.generateWords(1),
        age: genRange(genNums.ageMin, genNums.ageMax),
        edu: genRange(0, genNums.edu),
        work: genRange(0, genNums.work),
        group: joinRandom(genNums.group),
        friend: [],
        about: lorem.generateSentences(1)
    };
    users.push(usr);
}

for (let i = 0; i < genNums.edu; i++) {
    const eduInfo = {
        id: i,
        name: 'EDU ' + lorem.generateWords(3),
        member: []
    };
    edus.push(eduInfo);
}

for (let i = 0; i < genNums.work; i++) {
    const workInfo = {
        id: i,
        name: 'Work ' + lorem.generateWords(2),
        member: []
    };
    works.push(workInfo);
}

for (let i = 0; i < genNums.group; i++) {
    const groupInfo = {
        id: i,
        name: 'Group ' + lorem.generateWords(1),
        member: []
    };
    groups.push(groupInfo);
}

// Link
for (let i = 0; i < genNums.user; i++) {
    edus[users[i].edu].member.push(i);
    works[users[i].work].member.push(i);
    users[i].group.forEach((gid) => {
        groups[gid].member.push(i);
    });
}
for (let i = 0; i < genNums.user - 1; i++) {
    for (let j = i + 1; j < genNums.user; j++) {
        if (Math.random() < genNums.friendRate) {
            users[i].friend.push(j);
            users[j].friend.push(i);
        }
    }
}

// Output
const res = {
    users: users,
    edus: edus,
    works: works,
    groups: groups
};

fs.writeFile('data.json', JSON.stringify(res), ()=>{
    console.log('Generate Finish.');
});
