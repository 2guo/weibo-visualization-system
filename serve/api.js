const models = require('./db');
const express = require('express');
const router = express.Router();

// -------------------- /user接口相关逻辑 -------------------- //

/**
 * 获取所有用户信息
 */
router.get('/api/user', (req, res) => {
	let totalUser = 0;

	const { pagenum, name } = req.query;

	const nameReg = name ? { 'name': new RegExp(name) } : {};

	models.User.count(nameReg).exec((err, data) => {
		totalUser = data;
		getListFromBd();
	});

	/**
	 * 获取指定的list数据，分页获取
	 */
	function getListFromBd() {
		models.User.find(nameReg).skip((pagenum - 1) * 10).limit(10).exec((err, data) => {
			if (err) {
				res.send(err);
			} else {
				const result = {
					total: totalUser,
					data: data
				};
				res.send(result);
			}
		});
	}
});

// -------------------- /user-info接口相关逻辑 -------------------- //

let userWeibos = []; // 存储用户的微博数据
let userImages = []; // 存储用户的所有照片数据

router.get('/api/user-info/:id/base-info', (req, res) => {
	const id = +req.params.id; // 这里有个小坑：id要转换成number类型，否则在查询语句中会出异常

	models.Weibo.find({ 'user': id }).exec((err, data) => {
		userWeibos = data;
		userImages = formatImages(userWeibos);

		models.User.find({ 'id': id }, { 'fans': 0, 'follows': 0, '_id': 0 }).exec((err, data) => {
			if (err) {
				res.send(err);
			} else {
				const returnData = {
					data: data,
					imageNum: userImages.length
				}
				res.send(returnData);
			}
		});
	});
});

router.get('/api/user-info/:id/base-header-info', (req, res) => {
	const id = +req.params.id;

	models.User.find({ 'id': id }, { 'name': 1, 'avatar': 1 }).exec((err, data) => {
		if (err) {
			res.send(err);
		} else {
			res.send(data);
		}
	});

});

// -------------------- 用户微博时间线 相关逻辑 -------------------- //

let userAllWeibos = []; // 用户的所有微博 

router.get('/api/user-info/:id/weibo-timeline', (req, res) => {
	const id = +req.params.id;

	models.Weibo.find({ 'user': id }).sort({ 'created_at': 1 }).exec((err, data) => { // 依据时间正序
		userAllWeibos = data;
		const result = formatTimeLineData(data);

		if (err) {
			res.send(err);
		} else {
			res.send(result);
		}
	});
});

router.get('/api/user-info/weibo-timeline-detail', (req, res) => {
	const queryString = req.query.source;

	const result = [];

	if (queryString === '微博') {
		result.push({
			text: userAllWeibos[0].text,
			created_at: userAllWeibos[0].created_at,
			attitudes_count: userAllWeibos[0].attitudes_count,
			comments_count: userAllWeibos[0].comments_count,
		});
	} else {
		userAllWeibos.forEach(item => {
			if (item.source === queryString) {
				result.push({
					text: item.text,
					created_at: item.created_at,
					attitudes_count: item.attitudes_count,
					comments_count: item.comments_count,
					reposts_count: item.reposts_count

				});
			}
		});
	}

	res.send(result);
});

/**
* 构造时间线格式的数据
*/
function formatTimeLineData(data) {

	const sources = data.map(item => {
		return item.source;
	});

	const sourceList = new Set(sources); //去重
	const timeLineData = [];

	// 获取第一条微博
	timeLineData.push({
		'content': "微博",
		'timestamp': data[0].created_at,
	});

	data.forEach(item => {
		if (sourceList.has(item.source)) {
			timeLineData.push({
				'content': item.source,
				'timestamp': item.created_at,
			});
			sourceList.delete(item.source);
		}
	});

	return timeLineData;
}

// -------------------- 获取 用户图片接口 相关逻辑 -------------------- //
/**
 * 该接口需要将用户的照片获取出来保存到一个数组中，格式为：
 * [
 * 		{
 * 			src: '图片URl地址'
 * 			href: '图片URl地址'
 * 		}
 * ]
 */

/**
 * 将图片数据转变为上面的格式
 */
function formatImages(data) {
	let imagesArr = [];
	data.forEach(item => {
		if (item.pictures) { // 这里有一个巨坑，由于不理解mongoose中Schema含义，记得在对应的model中定义字段，才能正常的得到获取到这个字段，否则undefined
			imagesArr = imagesArr.concat(item.pictures);
		}
	});

	let result = [];

	imagesArr.forEach((item, index) => {
		result[index] = {
			'src': item,
			'href': item
		}
	});

	return result;
}

router.get('/api/user-info/id/weibo-imageslist', (req, res) => {

	const page = req.query.page;
	const isLase = page * 20 >= userImages.length;

	const responseData = {
		isLast: isLase,
		data: page >= 2 ? userImages.slice(20 * (page - 1), 20 * (page - 1) + 20) : userImages.slice(0, 20)
	}

	res.send(responseData);

});

module.exports = router;
