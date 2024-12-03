module.exports = (ctx) => {
	const register = () => {
		ctx.helper.uploader.register('lsky-uploader', {
			handle,
			config: config,
			name: 'lsky'
		})
	}
	return {
		uploader: 'lsky-uploader',
		register
	}
}

const handle = async (ctx) => {
	let userConfig = ctx.getConfig('picBed.lsky-uploader')
	if (!userConfig) {
		throw new Error('Can\'t find uploader config')
	}
	const Url = userConfig.Url
	const Token = userConfig.Token
	const strategyId = userConfig.strategyId

	const imgList = ctx.output
	for (let i in imgList) {
		let image = imgList[i].buffer
		if (!image && imgList[i].base64Image) {
			image = Buffer.from(imgList[i].base64Image, 'base64')
		}
		const postConfig = postOptions(Url, Token, imgList[i].fileName, image, strategyId)
		let body = await ctx.request(postConfig)
		body = JSON.parse(body)
		if (body.status) {
			delete imgList[i].base64Image
			delete imgList[i].buffer
			imgList[i].imgUrl = body.data.links.url
		} else {
			ctx.emit('notification', {
				title: '上传失败',
				body: body.message
			})
			throw new Error(body.message)
		}
	}
	return ctx
}

const postOptions = (Url, Token, fileName, image, strategyId) => {
	return {
		method: 'POST',
		url: Url + `/api/v1/upload`,
		headers: {
			contentType: 'multipart/form-data',
			'Accept': 'application/json',
			'Authorization': `Bearer ` + Token,
			'User-Agent': 'PicGo'
		},
		formData: {
			file: {
				value: image,
				options: {
					filename: fileName
				}
				
			},
			ssl: 'true',
			strategy_id: strategyId
		}
	}
}

const config = ctx => {
	let userConfig = ctx.getConfig('picBed.lsky-uploader')
	if (!userConfig) {
		userConfig = {}
	}
	return [{
			name: 'Url',
			type: 'input',
			default: userConfig.Url,
			required: true,
			message: '服务器域名',
			alias: '服务器域名'
		},
		{
			name: 'Token',
			type: 'input',
			default: userConfig.Token,
			required: true,
			message: '获取的Token',
			alias: '获取的Token'
		},
		{
			name: 'strategyId',
			type: 'input',
			default: userConfig.strategyId || '', 
			required: false, 
			message: '可选的策略ID',
			alias: '策略ID'
		}

	]
}
