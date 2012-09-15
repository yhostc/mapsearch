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
 +------------------------------------------------------------------------------
 * 类: DragBus
 * 拖拽导航线路
 +------------------------------------------------------------------------------
 */
DragBus = AMap.Class({
	_type:"dragroute",
	_obj:false,
	_path:[],	// 原始查询经纬度数组
	_list:[],
	_route:[],	// 绘线经纬度数组
	_foot:[],
	_marker:[],
	_f:1,		//查询指针
	_event:{},
	
	guid:AMap.Util.guid(),// 定制唯一主键
	
	/**
	 +----------------------------------------------------------
	 * 类初始化方法
	 +----------------------------------------------------------
	 * @param obj : 地图对象
	 * @param path : 查询坐标数组
	 +----------------------------------------------------------
	 */
	initialize:function(obj,path){
		this._obj = obj;
		obj.clearOverlays();
		this._path = [];
		this._list = [];
		for(var i=0;i<path.length;i++){
			this._list.push({id:"s"+"_"+AMap.Util.guid(),poi:path[i],o:1});
		}
		this._path = path;
	},
	/**
	 +----------------------------------------------------------
	 * 初始查询方法
	 +----------------------------------------------------------
	 * @param start 起点经纬度对象
	 * @param end   终点经纬度对象
	 +----------------------------------------------------------
	 */
	search:function(){
		var self = this,obj = this._obj,path=[];
		_keywords = this._list;
		//添加初始查询点图标
		for(var i=0;i<this._list.length;i++){
			this._event[this._list[i].id] = [];
			(function(p,i){
				var mkr =  new AMap.Marker({
					id:p.id,
					offset:new AMap.Pixel(-10,-34),
					position:p.poi,
					draggable:true,//可拖拽
					icon:"http://maps.gstatic.cn/mapfiles/markers2/marker_green"+String.fromCharCode(65+i)+".png",
					zIndex:20
				});
				obj.addOverlays(mkr);
				
				var de = function(){
					var arr=[];
					for(var i=0;i<self._list.length;i++){
						if(self._list[i].id==p.id){
							self._list[i].poi = mkr.getPosition();
						}
						arr.push(self._list[i].poi);
					}
					self.dataResult(arr);
					
					self._rgeocode(mkr.id,mkr.getPosition());
				};
				
				obj.bind(mkr,"dragend",de);
				
			})(this._list[i],i);
			path.push(this._list[i].poi);//记录经纬度数组，用于查询
		}
		self.dataResult(path);
		
	},
	/**
	 +----------------------------------------------------------
	 * 服务器数据请求
	 +----------------------------------------------------------
	 * @param path 两点的坐标数据
	 +----------------------------------------------------------
	 */
	 dataResult:function(path){
		var self = this,xys = [];
		for(var i in path){
			var lnglat = path[i];
			xys[i] = lnglat.lng+','+lnglat.lat;
		}
		xys = xys.join(';');
		var url = "http://api.amap.com:9090/bus/simple?sid=8001&key=130117d4a8c3932985602a0653a0c1e7fbc23eec2659fc519890c924f82b4475ddd71b058178d02b&xys="+xys+"&resType=json";
		new AMap.AjaxRequest(url, function(data){
			self.addBus(data);
			lineList = self.lineList;
			self.drawLine();
		});
	 },
	/**
	 +----------------------------------------------------------
	 * 导航路线绘制
	 +----------------------------------------------------------
	 * @param data 查询结果数据列表
	 +----------------------------------------------------------
	 */
	 drawLine:function(pguid){
		 var self = this,obj = this._obj,lineList = self.lineList;
		 obj.clearOverlaysByType('polyline');
		 obj.removeOverlays(self._marker);
		 self._marker=[];
			if(!lineList){return false;}// 数据查询失败,不做处理
			// 组织绘制线路径经纬度数组
			if(typeof(pguid) == 'undefined'){
				lineInitialize = lineList[0];
			}else{
				lineInitialize = lineList[pguid];
			}
			for(var i in lineInitialize){
				if(typeof(lineInitialize[i]) == 'string'){
					self._foot = [];
					endFoot = lineInitialize[i];
					var ef = endFoot.split(",");
					for(var k=0;k<ef.length;k++){
						if(k%2 == 0){
							var n = [];
							n[0] = ef[k];
						}else if(k%2 == 1){
							n[1] = ef[k];
							self._foot.push(new AMap.LngLat(n[0],n[1]));
						}
					}
					self._footline = new AMap.Polyline({
						id:"foot"+i,
						path:self._foot,
						strokeColor:"#0f0",
						strokeStyle:"dashed",
						strokeOpacity:1,
						strokeWeight:3
					});
					obj.addOverlays(self._footline);// 绘线
				}else{
					busName = lineInitialize[i].busName;
					startName = lineInitialize[i].startName;
					passCount = lineInitialize[i].passCount;
					busLine = lineInitialize[i].busLine;
					footLine = lineInitialize[i].footLine;
					self._route = [];
					self._foot = [];
					var l = busLine.split(",");
					var f = footLine.split(",");
					var p = {};
					var info = [];
					for(var j=0;j<l.length;j++){
						p['x'] = l[0];
						p['y'] = l[1];
						if(j%2 == 0){
							var m = [];
							m[0] = l[j];
						}else if(j%2 == 1){
							m[1] = l[j];
							self._route.push(new AMap.LngLat(m[0],m[1]));
						}
					}
					info = [];
					info.push("从"+startName);
					info.push("上车，途径"+passCount);
					info.push("站");
					
					var tm = document.createElement("div");
					tm.className = "marker";
					var tn = document.createElement("div");
					tn.innerHTML = info.join("");
					tm.appendChild(tn);
					
					var marker = new AMap.Marker({
						id:"title"+i,
						zIndex:10,
						position:new AMap.LngLat(p.x,p.y),//基点位置
						offset:new AMap.Pixel(-10,-35),//相对于基点的偏移位置
						content:tm //自定义覆盖物内容
					});
					self._marker.push(marker.id);
					obj.addOverlays(marker);
					obj.bind(marker.id,"mouseover",function(e){
						marker.setzIndex(30);
					});
									
					
					self._busline = new AMap.Polyline({
						id:"bus"+i,
						path:self._route,
						strokeColor:"#0bC",
						strokeOpacity:1,
						strokeWeight:5
					});
					obj.addOverlays(self._busline);// 绘线
					for(var k=0;k<f.length;k++){
						if(k%2 == 0){
							var n = [];
							n[0] = f[k];
						}else if(k%2 == 1){
							n[1] = f[k];
							self._foot.push(new AMap.LngLat(n[0],n[1]));
						}
					}
					self._footline = new AMap.Polyline({
						id:"foot"+i,
						path:self._foot,
						strokeColor:"#0f0",
						strokeStyle:"dashed",
						strokeOpacity:1,
						strokeWeight:3
					});
					obj.addOverlays(self._footline);// 绘线
				}
			}
			obj.setFitView();// 设置视野
	 },
	 /**
	 +----------------------------------------------------------
	 * 通过经纬度逆向搜索poi信息
	 +----------------------------------------------------------
	 * @param lnglat 查询需要的经纬度
	 +----------------------------------------------------------
	 */
	 _rgeocode:function(id,path){
		 var self = this;
		 $.ajax({type:"POST",dataType:"json",data:{x:path.lng,y:path.lat},url:"c.php/Server/rgeocode",
			 success:function(data){
				 var num = 0;
				 for(var i=0;i<self._list.length;i++){
					 if(id == self._list[i].id){
						 $("input[name=bus]").each(function(k) {
							 if(k == num){
								 $(this).val(data.name);
							 }
						});
					 }
					 num++
				 }
			 }
		 })
	 },
	/**
	 +----------------------------------------------------------
	 * 绑定事件
	 +----------------------------------------------------------
	 * @param data 查询结果数据列表
	 +----------------------------------------------------------
	 */
	_bind:function(){
		var self = this, obj = this._obj;
		
		var s = 0, // 点标记是否在线轨迹上移动状态
			d = 0; // 点标记是否在拖拽状态
		
		// 鼠标移动到线上时, 显示点标记, 并添加鼠标移动事件
		var mv = function(e){
			s = 1;// 定义移动状态
			self._point.setVisible(true);// 显示点标记
			obj.bind(obj,"mousemove",fn);// 注册地图移动事件
		};
		obj.bind(self._polyline,"mousemove",mv);
		self._event["p"+self.guid] = [];
		self._event["p"+self.guid].push({obj:self._polyline,t:"mousemove",fn:mv});
		
		var startPoi,lastList,f=0,gid;
		
		// 点标记拖拽开始
		var ds = function(e){
			d = 1; // 定义拖拽状态
			var arr = [];
			for(var i=0;i<self._list.length;i++){
				arr.push(self._list[i].poi);
			}
			startPoi = self._pt2LineDist(arr,e.lnglat);
			gid = "s"+AMap.Util.guid();//本次拖拽ID
		};
		
		obj.bind(self._point,"dragstart",ds);
		self._event["m"+self.guid] = [];
		self._event["m"+self.guid].push({obj:self._point,t:"dragstart",fn:ds});
		
		// 点标记拖拽过程中
		var dg = function(e){
			d = 1; // 定义拖拽状态
			if(self._f){
				// 在此位置添加一个固定点
				var lnglat = e.lnglat,list=[],arr=[];
				for(var i=0;i<self._list.length;i++){
					list.push(self._list[i]);
					arr.push(self._list[i].poi);
					if(i==startPoi.i){
						list.push({id:gid,poi:new AMap.LngLat(lnglat.lng,lnglat.lat)});
						arr.push(new AMap.LngLat(lnglat.lng,lnglat.lat));
					}
				}
				//self._reSearch(arr);
				lastList = list;//记录最后一次更改的POI
			}
			self._f = 0;
		};
		obj.bind(self._point,"dragging",dg);
		self._event["m"+self.guid].push({obj:self._point,t:"dragging",fn:dg});
		
		// 点标记拖拽结束, 添加一个固定的拖拽点
		var de = function(e){
			d = 0;// 重置拖拽状态
			
			self._list = lastList;
			self._addDragPoi(e.lnglat,gid);
			
			// 销毁地图移动事件，减轻压力
			obj.unbind(obj,"mousemove",fn);
			
		};
		obj.bind(self._point,"dragend",de);
	},
	/**
	 +----------------------------------------------------------
	 * 重新搜索路线
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param Pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_reSearch:function(path){
		var self = this;
		self._roadSearch.getNaviPath(path, function(data2){
			if(!data2.list){return false;}// 数据查询失败
			var list2 = data2.list,route2=[];
			// 组织绘线路径经纬度数组
			//var route = [];// 临时数组，用于组织经纬度数组
			for(var i=0;i<list2.length;i++){
				var l = list2[i].coor.split(";");
				for(var j=0;j<l.length;j++){
					var m = l[j].split(","); 
					route2.push(new AMap.LngLat(m[0],m[1]));
				}
			}
			self._route = route2;
			self._polyline.setPath(route2);
			self._f = 1;
			self._obj.trigger(self,"search",self);
		});
		
	},
	/**
	 +----------------------------------------------------------
	 * 求点到线集合中最短距离
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param Pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_pt2LineDist:function(line,Pt) {
		var a={dis:Number.MAX_VALUE};
		for (var i=0;i<line.length-1;i++) {
			var arr = [line[i],line[i+1]];
			var b = this._pt2LineSegmentDist(arr,Pt);
			if (b.dis < a.dis) {
				a = {lng:b.lng,lat:b.lat,dis:b.dis,i:i,_type:"lnglat"};
			}
		}
		//计算像素距离
		a.dis = Math.round(this._obj.getDistance(Pt,new AMap.LngLat(a.lng,a.lat))/this._obj.getResolution());
		return a;
	},
	/**
	 +----------------------------------------------------------
	 * 求点到线最短距离点及距离
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	_pt2LineSegmentDist:function(line,pt) {
		var x = 0,y = 0;
		var dX = line[1].lng - line[0].lng,dY = line[1].lat - line[0].lat;
		var dR = -(line[0].lat - pt.lat) * dY - (line[0].lng - pt.lng) * dX;
		var dL;
		if (dR <= 0) {
			x = line[0].lng;
			y = line[0].lat;
		} else if (dR >= (dL = dX * dX + dY * dY)) {
			x = line[1].lng;
			y = line[1].lat;
		} else {
			x = line[0].lng + dR * dX / dL;
			y = line[0].lat + dR * dY / dL;
		}
		//返回实地距离
		return {lng:x,lat:y,dis:Math.pow(pt.lng-x,2) + Math.pow(pt.lat - y,2)}
	},
	/**
	 +----------------------------------------------------------
	 * 删除其中一个途径点
	 +----------------------------------------------------------
	 * @param id 途经点ID
	 +----------------------------------------------------------
	 */
	removeWay:function(id){
		var arr=[],obj=this._obj,self=this;
		for(var i=0;i<this._list.length;i++){
			if(this._list[i].id == id){//删除途径点
				//删除事件
				var a = self._event[id];
				for(var j=0;j<a.length;j++){
					obj.unbind(a[j].obj,a[j].t,a[j].fn);
				}
				this._event[id] = null;
				delete this._event[id];
				obj.removeOverlays(id);
				this._list.splice(i,1);
				i--;
			}else{
				arr.push(this._list[i].poi);
			}
		}
		this._reSearch(arr);//重绘
	},
	/**
	 +----------------------------------------------------------
	 * 获取所有途径点
	 +----------------------------------------------------------
	 */
	getWays:function(){
		var arr=[];
		for(var i=0;i<this._list.length;i++){
			if(!this._list[i].o){
				arr.push(this._list[i]);
			}
		}
		return arr;
	},
	/**
	 +----------------------------------------------------------
	 * 获取当前轨迹线路
	 +----------------------------------------------------------
	 */
	getRoute:function(){
		return this._route;
	},
	
	/**
	 +----------------------------------------------------------
	 * 销毁所有注册的事件和覆盖物
	 +----------------------------------------------------------
	 * @param line 线经纬度集合
	 * @param pt 点经纬度坐标
	 +----------------------------------------------------------
	 */
	destory:function(){
		var obj = this._obj;
		//销毁所有事件
		for(var i in this._event){
			var a = this._event[i];
			for(var j=0;j<a.length;j++){
				obj.unbind(a[j].obj,a[j].t,a[j].fn);
			}
			this._event[i] = null;
			delete this._event[i];
			obj.removeOverlays(i);
		}
		//清空所有途径点
		for(var i=0;i<this._list.length;i++){
			if(!this._list[i].o){
				this._list.splice(i,1);
				i--;
			}
		}
		//清空隐藏的POI
		this._point = null;
		delete this._point;
		//清空原线路
		this._polyline = null;
		delete this._polyline;
	},
	/**
	+----------------------------------------------------------
	* 格式化返回的json数据添加到页面
	+----------------------------------------------------------
	* @param data 查询得到的导航信息
	+----------------------------------------------------------
	*/
	addBus:function(data){
	if(!data){return false;}
		var list = data.list,html = [],self = this,c = {};
		if(!list){
			html.push("<p style=\"padding:0 20px;\">未能计算出您搜索地点的公交路线。</p>");
			html.push("<p style=\"padding:0 20px;\">建议您：</p>");
			html.push("<ul class=\"info\">");
			html.push("<li>尝试不同的关键词</li>");
			html.push("<li>拖动地图的起点、终点至有效位置</li>");
			html.push("<li>尝试查看<a id=\"to_route\" href=\"javascript:void(0)\">驾车路线</a></li>");
			html.push("</ul>");
			$('.bus-result').html(html.join(""));
			$('#to_route').click(function(e) {
				var arr=[];
				for(var i=0;i<self._list.length;i++){
					arr.push(self._list[i].poi);
				}
				console.log(arr);
				$.getScript("js/DragRoute.js",function(e){
					route = new DragRoute(map,arr);
					route.search();
				});
                $(".search-cate li:eq(2)").click();
				
				$('.bus-result').html('');
            });
			return false;
		}
		self.lineList = new Object();
		for(var i=0;i<list.length;i++){
			var bus = list[i];
			html.push('<div id=\"'+i+'\" class=\"poi-m\">');
			var px = (parseFloat(i)+1)*26;
			html.push("<div class=\"poi-i\"><img style=\"margin-top:-"+px+"px\" src=\"images/icon.png\"></div>");
			html.push('<div class=\"poi-c\">');
			html.push('<a href=\"javascript:void(0)\" class=\"poi-n\" id=\"'+i+'\">');
			for(var j in bus.segmentList){
				var segment = bus.segmentList[j];
				html.push('->'+segment.endName);
			}
			html.push('</a>');
			var d = new Object();
			for(var j=0;j<bus.segmentList.length;j++){
				var segment = bus.segmentList[j];
				html.push('<p>');
				if(segment.footLength != 0){
					html.push('步行'+segment.footLength+'米至');
				}else{
					html.push('从');
				}
				html.push(segment.startName+'乘坐'+segment.busName+'到'+segment.endName+'，途径'+segment.passDepotCount+'站');
				html.push('</p>');
				d[j] = new Object();
				
				d[j]['busName'] = segment.busName;
				d[j]['startName'] = segment.startName;
				d[j]['passCount'] = segment.passDepotCount;
				d[j]['busLine'] = segment.coordinateList;
				d[j]['footLine'] = segment.footCoordinateList;
			}
			c[i] = new Object();
			c[i] = d;
			c[i]['endFoot'] = bus.footEndCoordinateList;
			if(typeof(bus.footEndLength) != 'undefind'){
				html.push('<p>');
				html.push('步行'+bus.footEndLength+'米到达目的地');
				html.push('</p>');
			}
			html.push('</div>');
			html.push('<div class="clear" />');
			html.push('</div>');
		}
		this.lineList = c;
		$('.bus-result').html(html.join(""));
		$('.poi-m').click(function(e) {
            self.drawLine($(this).attr('id'));
        });
	}
});
