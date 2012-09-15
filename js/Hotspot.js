// +----------------------------------------------------------------------
// | MapABC JavaScript API
// +----------------------------------------------------------------------
// | Copyright (c) 2010 http://MapABC.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed AutoNavi MapABC
// +----------------------------------------------------------------------
// | Author: yhostc <yhostc@gmail.com>
// +----------------------------------------------------------------------

/**
 +----------------------------------------------------------
 * hotspot 热点实现封装类
 +----------------------------------------------------------
 * obj 地图对象
 +----------------------------------------------------------
 */
Hotspot = function(obj,url,debug){
	this._type = "hotspot";
	//调试模式
	this.debug = debug || false;
	//切片ID数组
	this.tiles   = false;
	//热点数据
	this.hotspots = {};	
	//请求地址：
	this.url = url || "http://apis-pq-demo.test.mapabc.com/gms/simple?resType=json&sid=3025&mapId=164&get=mredata";
	//marker's id
	this.mkr = "_mkr_"+AMap.Util.guid();
	//使用热点的级别
	this.zooms = [1,18];
	//上次id
	this.lastId = "";
	//上次切片号
	this.lastTile = "";
	//执行初始化函数
	this.initialize(obj);
};
Hotspot.prototype = {
	/**
	 +----------------------------------------------------------
	 * 热点类，初始化
	 +----------------------------------------------------------
	 * @param obj 地图对象
	 +----------------------------------------------------------
	 */
	initialize : function (obj){
		//初始化，加载切片ID数组
		this.tiles = obj.getTiles();
		var self = this,zz = obj.getZoom();
		//初始化加载数据
		if(zz>=self.zooms[0] && zz<=self.zooms[1]){
			new AMap.AjaxRequest(this.url+"&tile="+this.tiles.join(",").replace(/-/g,'.')+"&z="+obj.getZoom(),function(data){
				self.addHotspot(data);
			});
		}
		
		//鼠标移动中，检查当前鼠标是否是热点区域
		obj.bind(obj,"mousemove",function(e){
			//获取当前鼠标所在切片对应的信息
			var tile = obj.lnglatToPixel(e.lnglat);
			var tileX = Math.floor(tile.x/256);
			var tileY = Math.floor(tile.y/256),
				key = tileX+'.'+tileY;
			var hot = self.hotspots[key];
			if(!hot){return false;}
			for(var i in hot){//遍历当前切片上所有热点，查看当前位置是否再此范围内
				var b = hot[i].bounds;
				//console.log(self.debug);
				if(self.debug){
					self.addMarker(obj,hot[i]);
				}else if(e.lnglat.lng>b[0] &&　e.lnglat.lng<b[2] && e.lnglat.lat<b[1] && e.lnglat.lat>b[3] && (self.lastId != hot[i].id || self.lastTile!=key)){//符合hotspot条件，添加自定义marker, 
					var arr = new Array();
					arr.push(new AMap.LngLat(b[2],b[1])); 
					arr.push(new AMap.LngLat(b[2],b[3])); 
					arr.push(new AMap.LngLat(b[0],b[3])); 
					arr.push(new AMap.LngLat(b[0],b[1])); 	
				
					var polygon=new AMap.Polygon({
						id:"polygon01",//多边形ID
						path:arr,//多边形顶点经纬度数组
						strokeColor:"#f00",//线颜色
						strokeOpacity:1,//线透明度
						strokeWeight:1,	//线宽
						fillColor: "#f5deb3",//填充色
						fillOpacity: 0.35 //填充透明度
					});
					//map.addOverlays(polygon);
					
					if(hot[i].pos=="false"){//跨切片pos处理
						var a = self.hotspots[(tileX-1)+"."+tileY];//左
						var b = self.hotspots[(tileX+1)+"."+tileY];//右
						var c = self.hotspots[tileX+"."+(tileY-1)];//上
						var d = self.hotspots[tileX+"."+(tileY+1)];//下
						if(a && a[i]){//左
							hot[i].pos = a[i].pos;
						}else if(b && b[i]){//右
							hot[i].pos = b[i].pos;
						}else if(c && c[i]){//上
							hot[i].pos = c[i].pos;
						}else if(d && d[i]){//下
							hot[i].pos = d[i].pos;
						}
					}
					self.addMarker(obj,hot[i]);
					self.lastId = i;
					self.lastTile = key;
				}
			}
		});
		
		//鼠标拖拽结束，差补性请求新切片热点数据
		var fn = function(){
			//获取新增的切片ID
			var tiles = self.getNewTiles(obj.getTiles());
			var z = obj.getZoom();
			if(tiles.length>0 && z>=self.zooms[0] && z<=self.zooms[1]){//存在切片变动时发出请求
				var url = self.url+"&tile="+tiles.join(",")+"&z="+z;
				//发送请求获取数据
				new AMap.AjaxRequest(url,function(data){
					self.addHotspot(data);
				});
			}
		};
		obj.bind(obj,"dragend",fn);
		obj.bind(obj,"zoomchange",function(){
			self.hotspots = {};//级别改变，清空缓存
			fn();//重新加载数据
		});
	},
	/**
	 +----------------------------------------------------------
	 * 创建一个Marker
	 +----------------------------------------------------------
	 * @param hot 热点对象
	 +----------------------------------------------------------
	 */
	addMarker:function(obj,hot){
		var html = [];
		var css = this.debug ?　"border:#09F solid 1px;" : "";
		html.push("<div style=\""+css);
		html.push("width:7px;height:7px;top:-3px;");
		html.push("position:absolute;cursor:pointer;\" title=\""+hot.name);
		html.push("\" pguid=\""+hot.id);
		html.push("\"></div>");

		var marker = new AMap.Marker({
			id:this.debug ? hot.id : this.mkr,
			position:new AMap.LngLat(hot.bounds[0],hot.bounds[1]),
			content:html.join("")
		});
		obj.addOverlays(marker);
		var self = this;
		//热点点击回调函数
		var fn = function(e){
			e.id = hot.id;
			e.position = hot.pos!="false" ? new AMap.LngLat(hot.pos.lng,hot.pos.lat) : new AMap.LngLat(hot.bounds[0],hot.bounds[3]);
			obj.trigger(self,"click",e);
			obj.bind(marker,"click",function(){
				self.openInfoWindow(hot.id,true);
			});
		};
		this._bind_(obj,marker,fn);
	},
	//根据PGUID打开信息窗体
	infowindow:null,
	openInfoWindow:function(id,m){
		var self = this;
		if(!this.infowindow){//定义信息窗体
			this.infowindow = new AMap.InfoWindow({
				size:new AMap.Size(250,0),
				offset:new AMap.Pixel(-78,-68),
				autoMove:true,
				content:""
			});
		}
		this.infowindow.autoMove = m?false:true;
		$.ajax({type:"POST",dataType:"json",data:{id:id},url:"c.php/Server/getPoiInfo",success:function(data){
			if(!data.status){alert(data.info);}
			var t = [],p = data.list;
			if(m){//是否需要移动到地图中心
				map.panTo(new AMap.LngLat(p.x,p.y));
			}
			t.push("<div class=\"info-n\">"+p.name+"</div>");
			t.push("<div class=\"info-c\"><span>电话</span>："+(p.tel?p.tel:"暂无")+"<br/>");
			t.push("<span>地址</span>："+p.address+"<br/>");
			t.push("</div>");
			self.infowindow.setContent(t.join(""));
			self.infowindow.open(map,new AMap.LngLat(p.x,p.y));
		}});
	},
	/**
	 +----------------------------------------------------------
	 * 添加热点信息
	 +----------------------------------------------------------
	 * @param data 查询得到的热点信息
	 +----------------------------------------------------------
	 */
	addHotspot:function(data){
		if(!data){return false;}
		for(var i in data.list){
			var spot = data.list[i];
			if(spot.status=="true" && spot.hotspots != null){
				this.hotspots[spot.tile] = {};//缓存切片热点数据
				for(var i=0;i<spot.hotspots.length;i++){//以id为单位存储数据，方便提取
					this.hotspots[spot.tile]["h"+spot.hotspots[i].id] = spot.hotspots[i];
				}
			}
		}
	},
	/**
	 +----------------------------------------------------------
	 * 获取新切片信息
	 +----------------------------------------------------------
	 * @param newTiles 最新切片
	 +----------------------------------------------------------
	 */
	getNewTiles : function (newTiles){
		var self = this;
		var addTiles = [],removeTiles = [];
		//寻找新增加的切片
		var temp = self.tiles.join(",");
		for(var i=0;i<newTiles.length;i++){
			if(temp.indexOf(newTiles[i])==-1){//这是一个新切片
				addTiles.push(newTiles[i]);
				self.tiles.push(newTiles[i]);
			}
		}
		//删除过期的切片
		var temp = newTiles.join(",");
		for(var j=0;j<self.tiles.length;j++){
			if(temp.indexOf(self.tiles[j])==-1){//这是一个过期切片
				removeTiles.push(self.tiles[j]);
				if(self.hotspots[self.tiles[j]]){
					self.hotspots[self.tiles[j]]=null;//删除过期热点数据
					delete self.hotspots[self.tiles[j]];
				}
				self.tiles.splice(j,1);//从数组删除该切片序号
				j--;
			}
		}
		return addTiles;
	},
	/**
	 +----------------------------------------------------------
	 * 事件唯一性处理
	 +----------------------------------------------------------
	 */
	events:{},
	_bind_:function(obj,mkr,fn){
		obj.unbind(this.events.mkr,"click",this.events.fn);
		obj.bind(mkr,"click",fn);
		this.events = {mkr:mkr,fn:fn};
	}
};