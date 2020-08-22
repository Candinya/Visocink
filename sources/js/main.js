const configFile = '/data.json';
const gContainerId = 'graph';

let rawData;

/**
 * @func 获取数据
 * @param {string} addr JSON文件的地址
 * @param {function} cb 回调函数
 */
const getData = (addr, cb) => {
    fetch(addr)
    .then((res) => {
        return res.json();
    })
    .then((raw) => {
        rawData = raw;
        return processData();
    })
    .then((data) => {
        cb(data);
    });
};

/**
 * @func 处理数据为节点和边
 * @returns {object} 处理可后用于绘图的数据
 */
const processData = () => {
    const gData = {
        nodes: [],
        edges: []
    };

    // 点：用户
    rawData.users.forEach((u) => {
        const usrNode = {
            id: u.id.toString(),
            label: u.id.toString(),
            class: 'user',
            data: u
        };
        gData.nodes.push(usrNode);

        
        // 连线：好友关系
        u.friend.forEach((f) => {
            if (f > u.id) {
                const edgeNode = {
                    source: u.id.toString(),
                    target: f.toString(),
                    label: '',
                    weight: 1
                };
                gData.edges.push(edgeNode);
            }
        });
    });

    // console.log(gData);
    return gData;
};

/**
 * @func 图像加载数据与渲染
 * @param {object} graph 图
 * @param {object} data 数据
 */
const gRenderData = (graph, data) => {
    graph.data(data);
    graph.render();
};

/**
 * @func 加载图像监听事件
 * @param {object} graph 图 
 */
const gEvent = (graph) => {
    graph.on('node:mouseenter', e => {
        const nodeItem = e.item;
        graph.setItemState(nodeItem, 'hover', true);
    });
    graph.on('node:mouseleave', e => {
        const nodeItem = e.item;
        graph.setItemState(nodeItem, 'hover', false);
    });
    graph.on('node:click', e => {
        const clickNodes = graph.findAllByState('node', 'click');
        clickNodes.forEach(cn => {
            graph.setItemState(cn, 'click', false);
        });
        const nodeItem = e.item;
        graph.setItemState(nodeItem, 'click', true);
        loadData(nodeItem._cfg.id);
    });
    graph.on('edge:mouseenter', e => {
        const edgeItem = e.item;
        graph.setItemState(edgeItem, 'hover', true);
    });
    graph.on('edge:mouseleave', e => {
        const edgeItem = e.item;
        graph.setItemState(edgeItem, 'hover', false);
    });
};

/**
 * @func 整理+去重+排序
 * @param {array} 目标数组
 * @param {boolean} 需要排序
 */
const knownSort = (arr, sort = false) => {
    // 排序去重
    arr.sort((a, b) => {
        return a.id - b.id;
    });
    let n = 1;
    while (n < arr.length) {
        if (arr[n].id === arr[n-1].id) {
            // 合并
            arr[n-1].info += ' ' + arr[n].info;
            arr[n-1].s += arr[n].s;
            arr[n-1].gs += arr[n].gs;
            arr.splice(n,1);
        } else {
            n++;
        }
    }
    if (sort) {
        // 优先度排序（降序
        arr.sort((a, b) => {
            return b.s - a.s ;
        });
    }
};

/**
 * @func 加载用户可能认识的人
 * @param {number} u 用户节点
 * @returns {object} 可能认识的人，以及关联的原因
 */
const getKnown = (u) => {
    let mayKnown = {
        alumna: [],
        colleague: [],
        group: [],
        friends: []
    };
    // Education
    rawData.edus[u.edu].member.forEach((stu) => {
        if (!u.friend.includes(stu)) {
            mayKnown.alumna.push({
                id: stu
            });
        }
    });
    // Work
    rawData.works[u.work].member.forEach((empl) => {
        if (!u.friend.includes(empl)) {
            mayKnown.colleague.push({
                id: empl
            });
        }
    });
    // Groups
    u.group.forEach((g) => {
        rawData.groups[g].member.forEach((m) => {
            if (m !== u.id && !u.friend.includes(m)) {
                mayKnown.group.push({
                    id: m,
                    s: 1
                });
            }
        });
    });
    // Friends
    u.friend.forEach((g) => {
        rawData.users[g].friend.forEach((m) => {
            if (m !== u.id && !u.friend.includes(m)) {
                mayKnown.friends.push({
                    id: m,
                    s: 1
                });
            }
        });
    });

    knownSort(mayKnown.alumna);
    knownSort(mayKnown.colleague);
    knownSort(mayKnown.group, true);
    knownSort(mayKnown.friends, true);
    
    return mayKnown;
};

/**
 * @func 加载单个用户的详细信息
 * @param {number} id 用户节点ID
 */
const loadData = (id) => {
    // console.log(id);
    const curU = rawData.users[id];
    document.getElementById('u-name').innerText = curU.name;
    document.getElementById('u-age').innerText = curU.age;
    document.getElementById('u-edu').innerText = rawData.edus[curU.edu].name;
    document.getElementById('u-work').innerText = rawData.works[curU.work].name;
    document.getElementById('u-about').innerText = curU.about;

    let listT;
    
    listT = '';
    document.getElementById('u-groups-count').innerHTML = curU.group.length;
    curU.group.forEach((g) => {
        listT += `<li>${rawData.groups[g].name}</li>`
    });
    document.getElementById('u-groups').innerHTML = listT;

    listT = '';
    document.getElementById('u-friends-count').innerHTML = curU.friend.length;
    curU.friend.forEach((g) => {
        listT += `<li>${rawData.users[g].name}</li>`
    });
    document.getElementById('u-friends').innerHTML = listT;

    const mightKnownS = getKnown(curU);
    listT = '';
    document.getElementById('u-might-alumna-count').innerHTML = mightKnownS.alumna.length;
    mightKnownS.alumna.forEach((u) => {
        listT += `<li><div>${rawData.users[u.id].name}</div></li>`
    });
    document.getElementById('u-might-alumna').innerHTML = listT;
    listT = '';
    document.getElementById('u-might-colleague-count').innerHTML = mightKnownS.colleague.length;
    mightKnownS.colleague.forEach((u) => {
        listT += `<li><div>${rawData.users[u.id].name}</div></li>`
    });
    document.getElementById('u-might-colleague').innerHTML = listT;
    listT = '';
    document.getElementById('u-might-group-count').innerHTML = mightKnownS.group.length;
    mightKnownS.group.forEach((u) => {
        listT += `<li><div>${rawData.users[u.id].name + ' (' + u.s + '共同群)'}</div></li>`
    });
    document.getElementById('u-might-group').innerHTML = listT;
    listT = '';
    document.getElementById('u-might-friend-count').innerHTML = mightKnownS.friends.length;
    mightKnownS.friends.forEach((u) => {
        listT += `<li><div>${rawData.users[u.id].name + ' (' + u.s + '共同好友)'}</div></li>`
    });
    document.getElementById('u-might-friend').innerHTML = listT;
};

/**
 * @func 初始化：数据加载
 */
const init = () => {
    getData(configFile, draw);
};

/**
 * @func 使用数据绘制
 * @param {object} gData 绘制用的数据
 */
const draw = (gData) => {
    const gMiniMap = new G6.Minimap({
        size: [ 100, 100 ],
        className: "minimap",
        type: 'delegate'
    });
    const gGrid = new G6.Grid();
    const gMain = new G6.Graph({
        container: gContainerId,
        width: document.body.clientWidth - 320,
        height: window.screen.availHeight - 200,
        animate: true,
        defaultEdge: {
            labelCfg: {
                autoRotate: true
            }
        },
        nodeStateStyles: {
            hover: {
                fill: 'lightsteelblue'
            },
            click: {
                stroke: 'steelblue',
                lineWidth: 2
            }
        },
        edgeStateStyles: {
            hover: {
                stroke: 'steelblue'
            }
        },
        layout: {
            type: 'force',
            linkDistance: 100,
            preventOverlap: true,
            nodeStrength: -30,
            edgeStrength: 0.1
        },
        modes: {
          default: [ 'drag-node', 'drag-canvas', 'zoom-canvas',
                    // 点提示框交互工具的配置
                    {
                      type: 'tooltip',
                      formatText(model) {
                        const text = model.data.name;
                        return text;
                      },
                      shouldUpdate: e => {
                        return true;
                      }
                    },
                    // 边提示框交互工具的配置
                    // {
                    //   type: 'edge-tooltip',
                    //   formatText(model) {
                    //     const text = 'Type: ' + model.data.type + '<br />'
                    //         + 'Info: ' + model.data.info;
                    //     return text;
                    //   },
                    //   shouldUpdate: e => {
                    //     return true;
                    //   }
                    // }
            ]
        },
        plugins: [ gMiniMap, gGrid ]    // 将 Minimap 和 Grid 插件的实例配置到图上
    });
    gRenderData(gMain, gData);
    gEvent(gMain);
};

window.onload = init();

