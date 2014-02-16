module.exports = {
	db: {
		username: '',
		password:'',
		host: '192.168.253.139',
		port: 27017
	},
	"flavor": "nounderscore",
	"debug": true,
    "get_filter": {}
    //{$or: [{'followed': {$ne: 'True'}}, {'replied': {$ne: 'True'}}]}
}